import React from "react";

const PlaceCards = () => {
  const places = [
    {
      name: "The Golden Spoon Bistro",
      rating: 4.5,
      reviews: 90,
      distance: 0.8,
      category: "Restaurant",
      image: "/images/bistro.jpg",
    },
    {
      name: "Grand Central Hotel",
      rating: 4.2,
      reviews: 84,
      distance: 1.2,
      category: "Hotel",
      image: "/images/hotel.jpg",
    },
    {
      name: "Daily Grind Cafe",
      rating: 4.7,
      reviews: 94,
      distance: 0.5,
      category: "Cafe",
      image: "/images/cafe.jpg",
    },
    {
      name: "City Bank ATM",
      rating: 3.9,
      reviews: 78,
      distance: 0.2,
      category: "ATM",
      image: "/images/atm.jpg",
    },
    {
      name: "Speedy Gas Station",
      rating: 4.1,
      reviews: 82,
      distance: 1.5,
      category: "Gas Station",
      image: "/images/gas_station.jpg",
    },
    {
      name: "Historic Clock Tower",
      rating: 4.8,
      reviews: 98,
      distance: 2.1,
      category: "Landmark",
      image: "/images/clock_tower.jpg",
    },
    {
      name: "Fashion Hub Mall",
      rating: 4.3,
      reviews: 86,
      distance: 1.8,
      category: "Shopping",
      image: "/images/mall.jpg",
    },
    {
      name: "Green Oasis Park",
      rating: 4.6,
      reviews: 92,
      distance: 0.9,
      category: "Landmark",
      image: "/images/park.jpg",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      {places.map((place) => (
        <div
          key={place.name}
          className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105"
        >
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate">{place.name}</h3>
            <div className="flex items-center text-sm text-gray-500 my-1">
              <span className="flex items-center">
                <svg
                  className="h-4 w-4 text-yellow-400 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.786.57-1.841-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
                {place.rating} ({place.reviews} reviews)
              </span>
            </div>
            <p className="text-sm text-gray-500">{place.distance} mi</p>
            <div className="flex items-center text-sm text-gray-500 mt-2 space-x-1">
              {/* Category Icon */}
              <span className="text-xs">{place.category}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaceCards;
