import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">

      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-transparent border-t-white border-r-white/50 rounded-full animate-spin"></div>
          </div>

          <div
            className="absolute -inset-2 border-2 border-transparent border-t-purple-400 border-r-blue-400 rounded-full animate-spin opacity-60"
            style={{ animationDuration: "3s", animationDirection: "reverse" }}
          ></div>
        </div>

        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce delay-200"></div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-pulse">
            Loading
          </div>
          <div className="text-sm text-white/60 mt-2 animate-pulse delay-500">
            Preparing your experience
          </div>
        </div>

        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
              animationDelay: `${i * 200}ms`,
              animationDuration: `${2000 + i * 500}ms`,
            }}
          ></div>
        ))}
      </div>
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>
    </div>
  );
};

export default Loading;
