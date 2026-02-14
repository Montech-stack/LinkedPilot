import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Required for potential long timeouts if needed, though simple fetch fits edge too. Node is safer for internal network calls.

export async function GET() {
    const pythonUrl = process.env.PYTHON_BACKEND_URL;
    if (!pythonUrl) {
        return NextResponse.json({ error: "Python backend not configured" }, { status: 503 });
    }

    try {
        const res = await fetch(`${pythonUrl}/logs?limit=50`, {
            method: "GET",
            headers: {
                "x-cron-secret": process.env.VERCEL_CRON_SECRET || "",
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Python backend error:", errorText);
            return NextResponse.json({ error: "Failed to fetch logs from backend" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
