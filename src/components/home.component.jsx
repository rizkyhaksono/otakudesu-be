"use client";

import { useEffect, useState } from "react";

const MyComponent = () => {
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetch("/api/home");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();
        setHomeData(result.data);
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div>
      {homeData ? (
        <div>
          <h2>Ongoing Anime</h2>
          <ul>
            {homeData.ongoing_anime.map((anime) => (
              <li key={anime.id}>{anime.name}</li>
            ))}
          </ul>
          <h2>Complete Anime</h2>
          <ul>
            {homeData.complete_anime.map((anime) => (
              <li key={anime.id}>{anime.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading home data...</p>
      )}
    </div>
  );
};

export default MyComponent;
