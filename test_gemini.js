async function testGeminiRest() {
    const API_KEY = "AIzaSyC6zGRndksCTgWkhLtx6WvubOrYezL0Ykw";
    console.log("Testing REST API...");
    try {
        const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=\${API_KEY}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                instances: [{ prompt: '3D Pixar style character of a heroic Indian boy named Bheem, photorealistic face, masterpiece' }],
                parameters: { sampleCount: 1 }
            })
        });
        const data = await response.json();
        console.log("HTTP Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("FAILED:", e);
    }
}
testGeminiRest();
