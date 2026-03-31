"use client"
export default function LoadFail() {
    return <div className="flex flex-col h-dvh w-full overflow-hidden bg-[#EEE9E1]">
        <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Failed to load</h1>
            <p className="text-gray-600 mb-6">Please try again later.</p>
            <button
                onClick={async () => {
                    window.location.reload();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Retry
            </button>
        </div>
    </div>
}