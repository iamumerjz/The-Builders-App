import React from "react";

export const SkeletonCard = () => (
  <div className="rounded-lg bg-card border border-border p-4 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded shimmer" />
        <div className="h-3 w-20 rounded shimmer" />
      </div>
    </div>
    <div className="h-3 w-full rounded shimmer" />
    <div className="h-3 w-3/4 rounded shimmer" />
    <div className="flex gap-2">
      <div className="h-6 w-16 rounded-full shimmer" />
      <div className="h-6 w-20 rounded-full shimmer" />
    </div>
    <div className="flex gap-2 pt-2">
      <div className="h-9 flex-1 rounded shimmer" />
      <div className="h-9 flex-1 rounded shimmer" />
    </div>
  </div>
);

export const SkeletonReview = () => (
  <div className="rounded-lg bg-card border border-border p-4 space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-24 rounded shimmer" />
        <div className="h-3 w-16 rounded shimmer" />
      </div>
    </div>
    <div className="h-3 w-full rounded shimmer" />
    <div className="h-3 w-5/6 rounded shimmer" />
  </div>
);

export const SkeletonCalendar = () => (
  <div className="rounded-lg bg-card border border-border p-4 space-y-3">
    <div className="h-5 w-32 rounded shimmer mx-auto" />
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-8 rounded shimmer" />
      ))}
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-28 h-28 rounded-xl shimmer" />
      <div className="flex-1 space-y-3">
        <div className="h-6 w-48 rounded shimmer" />
        <div className="h-4 w-32 rounded shimmer" />
        <div className="h-4 w-24 rounded shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div className="h-4 w-4 rounded shimmer mx-auto" />
              <div className="h-4 w-12 rounded shimmer mx-auto" />
              <div className="h-3 w-16 rounded shimmer mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonBooking = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-3 w-48 rounded shimmer" />
          <div className="h-3 w-24 rounded shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded shimmer" />
          <div className="h-7 w-20 rounded shimmer" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboardSidebar = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-3 w-16 rounded shimmer" />
        </div>
        <div className="h-3 w-8 rounded shimmer" />
      </div>
    ))}
  </div>
);

export const SkeletonBookingStep = () => (
  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
    <div className="h-5 w-40 rounded shimmer" />
    <div className="h-10 w-full rounded shimmer" />
    <div className="h-4 w-48 rounded shimmer" />
  </div>
);
