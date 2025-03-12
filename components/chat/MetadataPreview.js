"use client";

import { useEffect, useState } from "react";

export default function MetadataPreview({url}) {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMetadata = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setMetadata(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMetadata();
    }, [url]);
    
    if (error) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline transition-colors duration-200">
                {url}
            </a>
        );
    }

    if (loading) {
        return (
            <div className="my-2 max-w-xl w-full mx-auto border border-gray-700 rounded-md bg-gray-800/50 p-3 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-24 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!metadata) return null;

    return (
        <a 
            href={metadata.url || url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block my-3 max-w-xl mx-auto no-underline hover:no-underline"
        >
            <div className="flex flex-col overflow-hidden border border-gray-700 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 transition-colors duration-200">
                {metadata.image && (
                    <div className="w-full h-40 overflow-hidden bg-black">
                        <img 
                            src={metadata.image} 
                            alt={metadata.title || "Link preview"} 
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}
                <div className="p-3">
                    <div className="flex items-center mb-1">
                        {metadata.favicon && (
                            <img 
                                src={metadata.favicon} 
                                alt="" 
                                className="w-4 h-4 mr-2"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <p className="text-xs text-gray-400 truncate">
                            {new URL(metadata.url || url).hostname}
                        </p>
                    </div>
                    
                    {metadata.title && (
                        <h3 className="font-medium text-sm md:text-base text-white line-clamp-2 mb-1">
                            {metadata.title}
                        </h3>
                    )}
                    
                    {metadata.description && (
                        <p className="text-xs text-gray-300 line-clamp-2">
                            {metadata.description}
                        </p>
                    )}
                </div>
            </div>
        </a>
    );
}
