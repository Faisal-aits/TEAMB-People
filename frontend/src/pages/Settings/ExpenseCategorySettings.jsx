import { useEffect, useMemo, useState } from 'react';
import { expenseAPI } from '../../services/expenseAPI';
import './MasterSettings.css';

const emptyExpenseCategory = {
  name: '',
  limit_amount: '',
  description: ''
};

const ExpenseCategorySettings = () => {
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState(emptyExpenseCategory);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const filteredExpenseCategories = useMemo(() => {
    const term = categorySearchTerm.trim().toLowerCase();
    if (!term) return expenseCategories;

    return expenseCategories.filter((category) => (
      category.name?.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term)
    ));
  }, [expenseCategories, categorySearchTerm]);

  const loadExpenseCategories = async () => {
    try {
      setCategoryLoading(true);
      const response = await expenseAPI.getCategories();
      setExpenseCategories(response.data.categories || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load expense categories'
      });
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseCategories();
  }, []);

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    const name = categoryFormData.name.trim();
    const limitAmount = categoryFormData.limit_amount === ''
      ? null
      : Number(categoryFormData.limit_amount);

    if (!name) {
      setMessage({ type: 'error', text: 'Expense category name is required' });
      return;
    }

    if (limitAmount !== null && (Number.isNaN(limitAmount) || limitAmount < 0)) {
      setMessage({ type: 'error', text: 'Expense limit must be 0 or greater' });
      return;
    }

    try {
      setCategorySaving(true);
      setMessage({ type: '', text: '' });
      await expenseAPI.createCategory({
        name,
        limit_amount: limitAmount,
        description: categoryFormData.description.trim()
      });
      await loadExpenseCategories();
      setCategoryFormData(emptyExpenseCategory);
      setMessage({ type: 'success', text: 'Expense category created' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save expense category'
      });
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setCategorySaving(true);
      setMessage({ type: '', text: '' });
      await expenseAPI.deleteCategory(id);
      setMessage({ type: 'success', text: 'Category deleted successfully.' });
      loadExpenseCategories();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete category'
      });
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <div className="master-settings-page app-page">
      <div className="master-settings-header app-page-header">
        <div>
          <h2 className="app-page-title">Reimbursement Category Settings</h2>
          <p className="app-page-subtitle">Manage reimbursement categories used across TEAM B People.</p>
        </div>
      </div>

      {message.text && (
        <div className={`app-message ${message.type === 'success' ? 'app-message-success' : 'app-message-error'}`}>
          {message.text}
        </div>
      )}

      <div className="master-settings-grid">
        <section className="master-panel app-card app-card-padded">
          <h3 className="app-section-title">Add Reimbursement Category</h3>
          <form onSubmit={handleCategorySubmit} className="master-form app-form">
            <div className="app-form-group">
              <label>Category Name *</label>
              <input
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryChange}
                placeholder="e.g. Travel"
                required
                maxLength={100}
              />
            </div>

            <div className="app-form-group">
              <label>Limit Amount</label>
              <input
                type="number"
                name="limit_amount"
                value={categoryFormData.limit_amount}
                onChange={handleCategoryChange}
                placeholder="0 for no limit"
                min="0"
                step="0.01"
              />
            </div>

            <div className="app-form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={categoryFormData.description}
                onChange={handleCategoryChange}
                placeholder="Short category description"
                rows={4}
              />
            </div>

            <div className="master-actions app-actions">
              <button type="submit" className="app-button app-button-primary" disabled={categorySaving}>
                {categorySaving ? 'Saving...' : 'Add Category'}
              </button>
            </div>
          </form>
        </section>

        <section className="master-panel master-list-panel app-card app-card-padded">
          <div className="master-list-header">
            <div>
              <h3 className="app-section-title">Reimbursement Categories</h3>
              <span>{expenseCategories.length} total</span>
            </div>
            <input
              className="master-search"
              value={categorySearchTerm}
              onChange={(event) => setCategorySearchTerm(event.target.value)}
              placeholder="Search categories"
            />
          </div>

          <div className="master-table-wrap app-table-wrap">
            <table className="master-table app-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Limit</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryLoading ? (
                  <tr>
                    <td colSpan="4" className="app-empty-state">Loading expense categories...</td>
                  </tr>
                ) : filteredExpenseCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="app-empty-state">No expense categories found.</td>
                  </tr>
                ) : (
                  filteredExpenseCategories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{Number(category.limit_amount || 0) > 0 ? `INR ${category.limit_amount}` : 'No limit'}</td>
                      <td>{category.description || '-'}</td>
                      <td className="actions-cell">
                        <button 
                          className="master-action-btn delete"
                          onClick={() => deleteCategory(category.id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExpenseCategorySettings;
