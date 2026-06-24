import React from "react";
import { Link } from "react-router-dom";

export default function ActionCard({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col p-6 transition-all duration-300"
      style={{
        background: "#171717",
        border: "1px solid #222",
        borderRadius: "12px",
        minHeight: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#e85d04";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#222";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 flex items-center justify-center mb-5 transition-colors"
        style={{
          background: "rgba(232,93,4,0.1)",
          border: "1px solid rgba(232,93,4,0.25)",
          borderRadius: "8px",
        }}
      >
        <Icon className="w-5 h-5" style={{ color: "#e85d04" }} />
      </div>

      {/* Title */}
      <h3 className="font-display font-black text-base uppercase tracking-wide text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs leading-relaxed flex-1" style={{ color: "#777" }}>
        {description}
      </p>

      {/* Arrow */}
      <div className="mt-4 flex items-center gap-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest transition-colors"
          style={{ color: "#555" }}
        >
          Gestionar
        </span>
        <span
          className="transition-transform group-hover:translate-x-1"
          style={{ color: "#e85d04" }}
        >
          →
        </span>
      </div>
    </Link>
  );
}