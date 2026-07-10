const fs = require('fs');
const path = require('path');

// Target directory configuration
const TARGET_DIR = path.join(__dirname, 'trekImages');

// Ensure the directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created directory: ${TARGET_DIR}`);
}

async function run() {
    let page = 1;
    let seed = null;
    let hasNext = true;
    let downloadCount = 0;

    // 1. Pagination Loop for Viahimalaya API
    while (hasNext) {
        console.log(`\nFetching page ${page} from Viahimalaya...`);
        
        let apiUrl = `https://viahimalaya.com/api/treks/?page=${page}&limit=10`;
        if (seed) {
            apiUrl += `&seed=${seed}`;
        }

        const apiResponse = await fetch(apiUrl, {
            // Updated to use INTERNAL_API_KEY
            headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
        });
        const apiJson = await apiResponse.json();

        if (!apiJson.success || !apiJson.data.treks.length) {
            console.log("No data returned or API error encountered.");
            break;
        }

        const treks = apiJson.data.treks;

        // 2. Process each trek sequentially
        for (const trek of treks) {
            const fileName = `${trek.id}.jpg`;
            const filePath = path.join(TARGET_DIR, fileName);

            // Skip downloading if you already have it
            if (fs.existsSync(filePath)) {
                console.log(`  ⏩ Skipping "${trek.name}" (Already downloaded)`);
                continue;
            }

            console.log(`Processing: "${trek.name}" (${trek.location})`);

            try {
                // 3. Query Pexels for a portrait image
                const searchQuery = encodeURIComponent(`${trek.name}, ${trek.location}`);
                let pexelsUrl = `https://api.pexels.com/v1/search?query=${searchQuery}&orientation=portrait&per_page=1`;

                let pexelsResponse = await fetch(pexelsUrl, {
                    headers: { 'Authorization': process.env.PEXELS_API_KEY }
                });
                let pexelsJson = await pexelsResponse.json();

                // Fallback: search by just name if the name + location combo yields zero results
                if (!pexelsJson.photos || pexelsJson.photos.length === 0) {
                    console.log(`  ↳ Direct match failed. Testing fallback search for "${trek.name}"...`);
                    const fallbackQuery = encodeURIComponent(trek.name);
                    pexelsUrl = `https://api.pexels.com/v1/search?query=${fallbackQuery}&orientation=portrait&per_page=1`;
                    pexelsResponse = await fetch(pexelsUrl, { headers: { 'Authorization': process.env.PEXELS_API_KEY } });
                    pexelsJson = await pexelsResponse.json();
                }

                if (pexelsJson.photos && pexelsJson.photos.length > 0) {
                    const imageUrl = pexelsJson.photos[0].src.portrait || pexelsJson.photos[0].src.large;
                    
                    // 4. Download and save the image locally
                    const imgResponse = await fetch(imageUrl);
                    const arrayBuffer = await imgResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    fs.writeFileSync(filePath, buffer);
                    console.log(`  💾 Saved to local folder: ${fileName}`);
                    downloadCount++;
                } else {
                    console.log(`  ❌ No portrait images found on Pexels for "${trek.name}".`);
                }
            } catch (err) {
                console.error(`  ❌ Error processing trek ${trek.id}:`, err.message);
            }
        }

        // Update pagination states
        const pagination = apiJson.data.pagination;
        seed = pagination.seed;
        hasNext = pagination.has_next;
        page++;
    }

    console.log(`\n🎉 Process completed! Total new images downloaded: ${downloadCount}`);
}

run().catch(console.error);