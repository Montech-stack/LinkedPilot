export const MOCK_INITIAL_MAP = {
    central: {
        title: "Quantum Computing",
        icon: "⚛️"
    },
    branches: [
        {
            id: "b1",
            category: "Foundation",
            title: "Qubits & Superposition",
            summary: "Basic units of quantum info",
            detail: "Unlike classical bits (0 or 1), qubits can exist in a superposition of both states simultaneously. This property allows quantum computers to process massive parallel computations.",
            color: "var(--accent-cyan)",
            children: [
                { id: "b1-1", title: "Entanglement", detail: "Particles remaining connected over distances." },
                { id: "b1-2", title: "Interference", detail: "Wave-like behavior affecting probabilities." },
                { id: "b1-3", title: "Coherence Time", detail: "How long quantum states survive." }
            ]
        },
        {
            id: "b2",
            category: "Applications",
            title: "Cryptography",
            summary: "Breaking and making codes",
            detail: "Quantum computers threatens RSA encryption via Shor's algorithm but also enables unhackable Quantum Key Distribution (QKD).",
            color: "var(--accent-purple)",
            children: [
                { id: "b2-1", title: "Shor's Algorithm", detail: "Factoring large numbers efficiently." },
                { id: "b2-2", title: "QKD", detail: "Secure communication keys." },
                { id: "b2-3", title: "Post-Quantum Crypto", detail: "Algorithms resistant to quantum attacks." }
            ]
        },
        {
            id: "b3",
            category: "Challenges",
            title: "Error Correction",
            summary: "Fighting decoherence noise",
            detail: "Quantum states are fragile. Error correction requires many physical qubits to create one logical qubit, a major engineering hurdle.",
            color: "var(--accent-orange)",
            children: [
                { id: "b3-1", title: "Decoherence", detail: "Loss of quantum state to environment." },
                { id: "b3-2", title: "Surface Codes", detail: "Topological error correction schemes." },
                { id: "b3-3", title: "Scalability", detail: "Difficulty in adding more qubits." }
            ]
        },
        {
            id: "b4",
            category: "Trends",
            title: "Hybrid Computing",
            summary: "CPU + QPU working together",
            detail: "Near-term value comes from using quantum processors (QPUs) as accelerators for specific tasks alongside classical supercomputers.",
            color: "var(--accent-green)",
            children: [
                { id: "b4-1", title: "Variational Algorithms", detail: "Optimization loops." },
                { id: "b4-2", title: "Cloud Access", detail: "IBM Q, AWS Braket, Azure Quantum." },
                { id: "b4-3", title: "Benchmarking", detail: "Measuring quantum volume." }
            ]
        },
        {
            id: "b5",
            category: "Key Players",
            title: "Tech Giants & Startups",
            summary: "The race for quantum supremacy",
            detail: "Major tech companies like Google, IBM, and Microsoft are competing with well-funded startups like Rigetti and IonQ.",
            color: "var(--accent-pink)",
            children: [
                { id: "b5-1", title: "Google Sycamore", detail: "Superconducting qubits." },
                { id: "b5-2", title: "IBM Quantum", detail: "Roadmap to 1000+ qubits." },
                { id: "b5-3", title: "IonQ", detail: "Trapped ion technology." }
            ]
        },
        {
            id: "b6",
            category: "Future Outlook",
            title: "Quantum Advantage",
            summary: "Solving impossible problems",
            detail: "The point where quantum computers can solve useful problems faster than any classical computer, expected in drug discovery and materials science.",
            color: "var(--accent-yellow)",
            children: [
                { id: "b6-1", title: "Drug Discovery", detail: "Simulating molecular interactions." },
                { id: "b6-2", title: "Material Science", detail: "Designing new batteries/catalysts." },
                { id: "b6-3", title: "Finance", detail: "Portfolio optimization." }
            ]
        }
    ]
};

export const MOCK_EXPANSION = [
    { id: "exp-1", title: "Logical Qubits", summary: "Error-corrected units", detail: "Groups of physical qubits working together." },
    { id: "exp-2", title: "Cryogenics", summary: "Keeping it cool", detail: "Systems must run near absolute zero." },
    { id: "exp-3", title: "Control Electronics", summary: "Microwave pulses", detail: "Hardware to manipulate qubit states." },
    { id: "exp-4", title: "Quantum Internet", summary: "Connecting computers", detail: "Networking quantum devices via entanglement." },
    { id: "exp-5", title: "Grover's Algorithm", summary: "Faster search", detail: "Searching unstructured databases quadratically faster." }
];
