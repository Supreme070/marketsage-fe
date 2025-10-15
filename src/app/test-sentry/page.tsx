'use client';

export default function TestSentryPage() {
  const triggerError = () => {
    throw new Error('🔥 Test Sentry Error - Frontend Monitoring Active!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-white">
          Sentry Error Tracking Test
        </h1>
        <p className="text-gray-300">
          Click the button below to trigger a test error and verify Sentry is capturing it.
        </p>
        <button
          onClick={triggerError}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          Trigger Test Error
        </button>
        <p className="text-sm text-gray-400 mt-4">
          After clicking, check your Sentry dashboard for the error.
        </p>
      </div>
    </div>
  );
}
