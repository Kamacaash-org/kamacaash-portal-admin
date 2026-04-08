import React from "react";

const NoDataFound = ({ message = "No data found" }) => {
  return (
    <div className="text-center py-5">
      <i className="ri-inbox-line display-5 text-muted"></i>
      <h5 className="mt-3 mb-1">No Data Found</h5>
      <p className="text-muted mb-0">{message}</p>
    </div>
  );
};

export default NoDataFound;
