import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "nextra-theme-docs";

export const SlackAppERD = () => {
    const { resolvedTheme } = useTheme();
    const [iframeSrc, setIframeSrc] = useState('');
    
    useEffect(() => {
        // This code now runs only on the client side
        if (resolvedTheme === "dark") {
            setIframeSrc("https://dbdiagram.io/e/66460034f84ecd1d225b7d68/66460063f84ecd1d225b82f2");
        } else {
            setIframeSrc("https://dbdiagram.io/e/6644dfeff84ecd1d2244fbde/6644e883f84ecd1d2245ac3c");
        }
    }, [resolvedTheme]);

    return (
        <iframe
            width="100%"
            height="720"
            src={iframeSrc}
            title="DB Diagram"
        ></iframe>
    );
};