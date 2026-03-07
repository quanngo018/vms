import React from 'react';

/**
 * Event History Page - Shows all detected events
 * Will have a table with filters
 */
function EventHistory() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Event History</h1>
      <p className="text-gray-600">
        Historical events and detections will be listed here
      </p>
      {/* We'll add event table on Day 4 */}
    </div>
  );
}

export default EventHistory;
