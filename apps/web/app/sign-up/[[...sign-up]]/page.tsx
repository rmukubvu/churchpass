import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-white/40 text-sm mt-1">Join to RSVP for church events</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#1a1a1a] border border-white/5 shadow-2xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-white/40",
              socialButtonsBlockButton:
                "bg-[#252525] border border-white/10 text-white hover:bg-[#2f2f2f] transition-colors",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30",
              formFieldLabel: "text-white/60 text-sm",
              formFieldInput:
                "bg-[#252525] border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500",
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
            },
          }}
        />
      </div>
    </div>
  );
}
