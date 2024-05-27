const { Workflow, WorkflowTask } = require('../models');

class WorkflowResource {
  constructor(data) {
    this.data = data instanceof Workflow ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.WorkflowTasks !== undefined) {
      relations.tasks = this.data.WorkflowTasks.map((d) => {
        const task = d instanceof WorkflowTask ? d.get({ plain: true }) : d;
        return task;
      });
      // .sort((a, b) => a.pos - b.pos);
    }
    if (this.data.Vendor !== undefined) {
      const VendorResource = require('./VendorResource');
      relations.vendor = this.data.Vendor ? new VendorResource(this.data.Vendor) : null;
    }

    const counts = {};
    if (this.data.workflowTasksCount !== undefined) {
      counts.workflow_tasks_count = this.data.workflowTasksCount;
    }

    return {
      id: this.data.id,
      name: this.data.name,
      vendor_id: this.data.vendor_id,
      created_by: this.data.created_by,
      created_at: this.data.created_at,
      // one-on-one pattern
      trigger: this.data.CampaignWorkflow?.trigger || null,
      campaign_id: this.data.CampaignWorkflow?.campaign_id || null,
      campaign_workflow_id: this.data.CampaignWorkflow?.id || null,
      ...counts,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new WorkflowResource(data).toJSON());
  }
}

module.exports = WorkflowResource;
