"use client";

import { useEffect, useState } from "react";

export default function MetadataPreview({url}) {
     
    const [metadata, setMetadata] = useState(null);
    
    const [error, setError] = useState("");

    const fetchMetadata = async () => {
        setError("");

        try {
            const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setMetadata(data);
        } catch (err) {
            setError(err.message);
        }
    }
    useEffect( () => {
            const fetch = async()=>await fetchMetadata();
            fetch();
    }, []);
    return (
        <div style={{ maxWidth: "200px", margin: "20px auto", textAlign: "center" }}>
           

            {error && <p style={{ color: "red" }}>{error}</p>}

            {metadata && (
                <div>
                    
                    <h3>{metadata.title}</h3>
                    {metadata.image && (
                        <img src={metadata.image} alt="Preview" style={{ width: "100%" }} />
                    )}
                    <p>{metadata.description}</p>
                    <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline transition-colors duration-200">
                      {metadata.url}
                    </a>
                </div>
            )}
        </div>
    );
}
