import React from "react";

const SummaryCard = ({ icon, text, number, bgColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      <div className="flex items-center gap-4">
        <div className={`p-3 lg:p-4 rounded-xl flex items-center justify-center ${bgColor} shadow-md`}>
          {icon}
        </div>

        <div>
          <p className="text-slate-500 text-sm">{text}</p>
          <div className="mt-1 text-2xl lg:text-3xl font-extrabold text-slate-900">{number}</div>
        </div>
      </div>

      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1 sm:gap-0">
        <span className="text-xs text-slate-400">vs last period</span>
        <div className="inline-flex items-center gap-1 text-sm text-green-600 font-semibold">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 12l-7-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          +3.8%
        </div>
      </div>

    </div>
  );
};

export default SummaryCard;
