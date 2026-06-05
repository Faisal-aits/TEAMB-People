const projectModel = require('./projectModel');

const projectController = {
  getAllProjects: async (req, res) => {
    try {
      const projects = await projectModel.getAll(req.tenantId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  getProjectById: async (req, res) => {
    try {
      const project = await projectModel.getById(req.tenantId, req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  },

  createProject: async (req, res) => {
    try {
      if (!req.body.clientId && !req.body.client_id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }
      if (!req.body.name) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      
      const newId = await projectModel.create(req.tenantId, req.body);
      const created = await projectModel.getById(req.tenantId, newId);
      res.status(201).json({ message: 'Project created successfully', project: created });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  updateProject: async (req, res) => {
    try {
      if (!req.body.clientId && !req.body.client_id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }
      if (!req.body.name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      await projectModel.update(req.tenantId, req.params.id, req.body);
      const updated = await projectModel.getById(req.tenantId, req.params.id);
      res.json({ message: 'Project updated successfully', project: updated });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },

  deleteProject: async (req, res) => {
    try {
      await projectModel.delete(req.tenantId, req.params.id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
};

module.exports = projectController;
