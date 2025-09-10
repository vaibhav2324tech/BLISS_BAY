import React, { useState } from 'react';
import { Plus, X, Save, AlertCircle } from 'lucide-react';

const AddTables = () => {
  const [tableData, setTableData] = useState({
    tableNumber: '',
    capacity: 4,
    status: 'available',
    section: 'indoor',
    currentGuests: 0,
    assignedWaiter: '',
    isActive: true,
    features: {
      hasCharger: false,
      isWheelchairAccessible: false,
      hasAirConditioner: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const sectionOptions = [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'private', label: 'Private' },
    { value: 'rooftop', label: 'Rooftop' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTableData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setTableData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const validateForm = () => {
    if (!tableData.tableNumber.trim()) {
      setError('Table number is required');
      return false;
    }
    if (tableData.capacity < 1 || tableData.capacity > 20) {
      setError('Capacity must be between 1 and 20');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Replace this URL with your actual API endpoint
      const response = await fetch('http://localhost:4000/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Adjust authorization based on your auth system
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(tableData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Table created successfully!');
        
        // Reset form after successful creation
        setTableData({
          tableNumber: '',
          capacity: 4,
          status: 'available',
          section: 'indoor',
          currentGuests: 0,
          assignedWaiter: '',
          isActive: true,
          features: {
            hasCharger: false,
            isWheelchairAccessible: false,
            hasAirConditioner: true
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create table');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating table:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTableData({
      tableNumber: '',
      capacity: 4,
      status: 'available',
      section: 'indoor',
      currentGuests: 0,
      assignedWaiter: '',
      isActive: true,
      features: {
        hasCharger: false,
        isWheelchairAccessible: false,
        hasAirConditioner: true
      }
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Plus className="w-6 h-6" />
          Add New Table
        </h1>
        <p className="text-gray-600 mt-1">Create a new table for your restaurant</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Main Form */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            {/* Table Number */}
            <div>
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Table Number *
              </label>
              <input
                type="text"
                id="tableNumber"
                name="tableNumber"
                value={tableData.tableNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., T001, A1, Table-5"
                required
              />
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={tableData.capacity}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={tableData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                id="section"
                name="section"
                value={tableData.section}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sectionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
            
            {/* Current Guests */}
            <div>
              <label htmlFor="currentGuests" className="block text-sm font-medium text-gray-700 mb-1">
                Current Guests
              </label>
              <input
                type="number"
                id="currentGuests"
                name="currentGuests"
                value={tableData.currentGuests}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Assigned Waiter */}
            <div>
              <label htmlFor="assignedWaiter" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Waiter ID (Optional)
              </label>
              <input
                type="text"
                id="assignedWaiter"
                name="assignedWaiter"
                value={tableData.assignedWaiter}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter waiter ID"
              />
            </div>

            {/* Is Active Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={tableData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Table is active
              </label>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Has Charger */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasCharger"
                name="features.hasCharger"
                checked={tableData.features.hasCharger}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasCharger" className="ml-2 block text-sm text-gray-700">
                Has Charger
              </label>
            </div>

            {/* Wheelchair Accessible */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isWheelchairAccessible"
                name="features.isWheelchairAccessible"
                checked={tableData.features.isWheelchairAccessible}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isWheelchairAccessible" className="ml-2 block text-sm text-gray-700">
                Wheelchair Accessible
              </label>
            </div>

            {/* Has Air Conditioner */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasAirConditioner"
                name="features.hasAirConditioner"
                checked={tableData.features.hasAirConditioner}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasAirConditioner" className="ml-2 block text-sm text-gray-700">
                Has Air Conditioner
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Form
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating Table...' : 'Create Table'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTables;