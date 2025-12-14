export default {
  async fetch(request) {
    const url = new URL(request.url);
    const inputUrl = url.searchParams.get('url');

    // Step 1: Validate Input
    if (!inputUrl || !inputUrl.includes('tiktok.com')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing or invalid TikTok URL'
        }, null, 2),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Alternative TikTok downloader APIs try karte hain
    const apis = [
      {
        name: "tikwm",
        url: `https://www.tikwm.com/api/?url=${encodeURIComponent(inputUrl)}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.tikwm.com/',
          'Origin': 'https://www.tikwm.com'
        }
      },
      {
        name: "tikcdn",
        url: `https://tikcdn.io/api/button?url=${encodeURIComponent(inputUrl)}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      }
    ];

    let finalResult = null;

    // Har API try karte hain
    for (const api of apis) {
      try {
        console.log(`Trying API: ${api.name}`);
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: api.headers,
          redirect: 'follow'
        });

        if (response.ok) {
          const data = await response.json();
          
          // Different APIs ke different response formats handle karte hain
          if (api.name === "tikwm" && data.data) {
            finalResult = {
              video: data.data.play,
              thumbnail: data.data.cover,
              title: data.data.title,
              author: data.data.author?.nickname || null,
              duration: data.data.duration
            };
            break;
          } else if (api.name === "tikcdn" && data.url) {
            finalResult = {
              video: data.url,
              thumbnail: data.thumbnail || null,
              title: data.title || null,
              author: data.author || null
            };
            break;
          }
        }
      } catch (err) {
        console.log(`API ${api.name} failed: ${err.message}`);
        // Agla API try karo
        continue;
      }
    }

    // Agar koi API kaam kare to response bhejo
    if (finalResult && finalResult.video) {
      return new Response(
        JSON.stringify({
          status: 'success',
          video: finalResult.video,
          thumbnail: finalResult.thumbnail,
          title: finalResult.title,
          author: finalResult.author,
          duration: finalResult.duration,
          channel: '@old_studio786'
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Agar sab APIs fail ho jaye to direct download try karte hain
    try {
      const directApiUrl = `https://tikdown.org/get?url=${encodeURIComponent(inputUrl)}`;
      const directResponse = await fetch(directApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData.video) {
          return new Response(
            JSON.stringify({
              status: 'success',
              video: directData.video,
              thumbnail: directData.cover || null,
              title: directData.title || null,
              author: directData.author || null,
              channel: '@old_studio786'
            }, null, 2),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store'
              }
            }
          );
        }
      }
    } catch (err) {
      console.log('Direct API also failed');
    }

    // Sab fail ho gaya to error
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'All download methods failed. TikTok may have updated their protection.',
        channel: '@old_studio786'
      }, null, 2),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};