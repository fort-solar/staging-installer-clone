import React from "react";

type AuthMessageProps = {
  message?: string;
  tone?: "success" | "error";
};

const AuthMessage = ({ message, tone = "success" }: AuthMessageProps) => {
  if (!message) {
    return null;
  }

  const styles =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
};

export { AuthMessage };
