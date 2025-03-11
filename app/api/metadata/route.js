"use server";

import { NextResponse } from "next/server";
import * as cheerio from 'cheerio'

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch the URL" }, { status: response.status });
        }

        const html = await response.text();
        const metadata = extractMetadata(html, url);

        return NextResponse.json(metadata, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}

function extractMetadata(html, url) {
    const $ = cheerio.load(html);

    const getMetaContent = (name) =>
        $(`meta[property='${name}'], meta[name='${name}']`).attr("content") ||
        $(`meta[name='${name}']`).attr("content") ||
        "";

    return {
        title: $("title").text() || getMetaContent("og:title") || url,
        description: getMetaContent("og:description") || getMetaContent("description") || undefined,
        image: getMetaContent("og:image") ||  undefined,
        url,
    };
}