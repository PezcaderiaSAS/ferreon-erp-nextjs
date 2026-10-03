'use client';

import React, { useState } from 'react';
import { CalendarDays, Clock, ChevronDown, ArrowRight, Video } from 'lucide-react';

export function PremiumUpcomingMeetings() {
  const [selectedDay, setSelectedDay] = useState(11);

  const dates = [
    { day: 8, label: 'Mon' },
    { day: 9, label: 'Tue' },
    { day: 10, label: 'Wed' },
    { day: 11, label: 'Thu' },
    { day: 12, label: 'Fri' },
    { day: 13, label: 'Sat' },
  ];

  return (
    <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-[220px_1fr] bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
      {/* 1. Left Gradient Sidebar */}
      <aside className="bg-gradient-to-b from-[#4f46e5] to-[#3730a3] text-white p-6 sm:p-7 flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center mb-5 text-white shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-white">
            Upcoming Meetings
          </h3>
          <p className="text-xs text-white/80 mt-1 font-medium">3 meetings</p>
          <p className="text-xs text-white/60 mt-3 font-mono">Thu, 11 Sep 2025</p>
        </div>

        <div className="pt-6 border-t border-white/15 flex items-center gap-2 text-xs text-white/80 font-medium">
          <Clock className="w-4 h-4 text-white/70" />
          <span>3 upcoming today</span>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="p-6 sm:p-7 flex flex-col justify-between gap-5 bg-white">
        {/* Top Month Selector & Horizontal Dates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/70 border border-slate-200/50 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>September 2025</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <span className="text-[11px] font-semibold text-slate-400">Week 37</span>
          </div>

          {/* Horizontal Date Selector */}
          <div className="grid grid-cols-6 gap-2">
            {dates.map((d) => {
              const isActive = selectedDay === d.day;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  className={`py-2 px-1 rounded-[16px] flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)] scale-102'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                  }`}
                >
                  <strong className="text-sm font-extrabold">{d.day}</strong>
                  <span className="text-[10px] font-medium opacity-80">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Meeting Event Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 shrink-0 animate-ping" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                Rental Contract Review & Fleet Ops
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Your meeting starts in 10 minutes (Room A)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Avatar Group */}
            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                AS
              </span>
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                ML
              </span>
              <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                +2
              </span>
            </div>

            <button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Join</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-2 text-right">
          <button
            type="button"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
          >
            <span>View all meetings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </main>
    </div>
  );
}
