import { db } from '../../db.js';
import webpush from 'web-push';

export const jobQueue = {
  queue: [],
  processing: false,
  
  add(jobName, payload) {
    this.queue.push({ jobName, payload, retries: 0 });
    this.process();
  },

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        await this.executeJob(job.jobName, job.payload);
      } catch (err) {
        if (job.retries < 3) {
          job.retries++;
          this.queue.push(job); // push back to the end
        } else {
          console.error(`[QUEUE_ERROR] Job ${job.jobName} failed permanently after 3 retries:`, err.message);
        }
      }
    }
    this.processing = false;
  },

  async executeJob(jobName, payload) {
    switch (jobName) {
      case 'SEND_PUSH_NOTIFICATION': {
        const { userId, data } = payload;
        // Thực thi hàm push
        await this.doPush(userId, data);
        break;
      }
      
      case 'PROCESS_WEBHOOK': {
         // Process external heavy workloads
         console.log('Processing heavy workload for payload:', payload);
         break;
      }
      // Add more async jobs here...
      default:
        console.warn('Unknown job type:', jobName);
    }
  },
  
  async doPush(userId, payload) {
      const subSetting = await db.settings.getByKey(`push_sub_list_${userId}`);
      if (!subSetting || !subSetting.value) return;
      let subs = typeof subSetting.value === 'string' ? JSON.parse(subSetting.value) : subSetting.value;
      if (!Array.isArray(subs)) subs = [subs];
      
      const results = await Promise.allSettled(subs.map(sub => 
        webpush.sendNotification(sub, JSON.stringify(payload))
      ));
      
      const validSubs = subs.filter((_, index) => {
        const res = results[index];
        if (res.status === 'rejected') {
          return res.reason.statusCode !== 410 && res.reason.statusCode !== 404;
        }
        return true;
      });

      if (validSubs.length !== subs.length) {
        await db.settings.update(`push_sub_list_${userId}`, JSON.stringify(validSubs));
      }
  }
};
