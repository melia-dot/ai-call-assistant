export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI Call Assistant
        </h1>
        <p className="text-gray-600 mb-8">
          NuVance Labs intelligent call routing system
        </p>
        <div className="space-y-4">
          <a 
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Admin Dashboard
          </a>
          <p className="text-sm text-gray-500">
            Call handling is automated via Twilio webhooks
          </p>
        </div>
      </div>
    </div>
  )
}