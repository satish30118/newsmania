import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../utils/auth";
import { useNavigate } from "react-router-dom";

const BACKEND = process.env.REACT_APP_BACKEND;
const newsChannels = [
  {
    id: "toi",
    name: "Times of India",
    image: "toi.png",
    color: "bg-red-600",
  },
  {
    id: "thehindu",
    name: "The Hindu",
    image: "hindu.png",
    color: "bg-blue-800",
  },
  {
    id: "ht",
    name: "Hindustan Times",
    image: "hd.avif",
    color: "bg-yellow-500",
  },
  {
    id: "indianexpress",
    name: "Indian Express",
    image: "indianexp.jpg",
    color: "bg-purple-600",
  },
];

export default function NewsFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Check for saved dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  const fetchSource = async (source) => {
    setLoading(true);
    setActiveSource(source);
    try {
      const res = await axios.get(`${BACKEND}/api/news/${source.id}`);
      const itemsWithImages = res.data.map((item) => ({
        ...item,
        image:
          item.image ||
          "https://images.unsplash.com/photo-1585829365295-ab7cd400c7e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      }));
      setItems(itemsWithImages);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoading(false);
  };

  const saveBookmark = async (item) => {
    try {
      const summary = await getSummary(item);
      await axios.post(
        `${BACKEND}/api/bookmarks`,
        { title: item.title, link: item.link, summary, source: item.source },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Article bookmarked successfully!");
    } catch (error) {
      alert("Failed to bookmark article");
      console.error(error);
    }
  };

  const getSummary = async (item) => {
    try {
      const res = await axios.post(
        `${BACKEND}/api/summarize`,
        { url: item.link, title: item.title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.summary;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const openNews = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } shadow-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo/Branding */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {/* Circle logo */}
            <div
              className={`w-10 h-10 rounded-full ${
                darkMode
                  ? "bg-gradient-to-br from-teal-500 to-emerald-500"
                  : "bg-gradient-to-br from-teal-400 to-emerald-400"
              } flex items-center justify-center text-white font-bold`}
            >
              NM
            </div>

            {/* Brand name */}
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-400">
              NewsMania
            </h1>
          </div>

          {/* Right-side icons */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode
                  ? "bg-gray-700 text-yellow-300"
                  : "bg-gray-200 text-gray-700"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Bookmarks Link */}
            <button
              onClick={() => navigate("/bookmarks")}
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              aria-label="View bookmarks"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button
                className={`p-1 rounded-full ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
                aria-label="User profile"
              >
                <div
                  className={`w-8 h-8 rounded-full ${
                    darkMode ? "bg-blue-600" : "bg-blue-500"
                  } flex items-center justify-center text-white`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                  darkMode ? "bg-gray-700" : "bg-white"
                } hidden group-hover:block transition-all duration-200 origin-top-right`}
              >
                <button
                  onClick={() => navigate("/profile")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  View Profile
                </button>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Selected News Channel (when one is selected) */}
      {activeSource && (
        <div
          className={`max-w-7xl mx-auto px-4 py-3 ${
            darkMode ? "bg-gray-800" : "bg-blue-50"
          } transition-all duration-300`}
        >
          <div className="flex items-center space-x-4">
            <img
              src={activeSource.image}
              alt={activeSource.name}
              className="w-12 h-12 object-contain"
            />
            <h2 className="text-xl font-bold">{activeSource.name}</h2>
            <button
              onClick={() => setActiveSource(null)}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* News Channel Selection (when no channel is selected) */}
        {!activeSource && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Select a News Channel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newsChannels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => fetchSource(channel)}
                  className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div
                    className={`h-32 ${channel.color} flex items-center justify-center`}
                  >
                    <img
                      src={channel.image}
                      alt={channel.name}
                      className="h-full w-full  transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-center">
                      {channel.name}
                    </h3>
                    <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                      Click to browse
                    </div>
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Articles */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className={`animate-spin rounded-full h-16 w-16 border-t-4 ${
                darkMode ? "border-blue-400" : "border-blue-600"
              }`}
            ></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it, idx) => (
              <div
                key={idx}
                className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
                onClick={() => openNews(it.link)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={it.image}
                    alt={it.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span
                      className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${
                        darkMode ? "bg-blue-500" : "bg-blue-600"
                      }`}
                    >
                      {it.source.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h2
                    className={`text-lg font-bold mb-3 line-clamp-2 ${
                      darkMode ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {it.title}
                  </h2>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveBookmark(it);
                      }}
                      className={`px-3 py-1 rounded-lg flex items-center gap-2 transition-colors ${
                        darkMode
                          ? "bg-blue-900 text-blue-200 hover:bg-blue-800"
                          : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      Save
                    </button>
                    <SummaryInline
                      item={it}
                      token={token}
                      darkMode={darkMode}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryInline({ item, token, darkMode }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND}/api/summarize`,
        { url: item.link, title: item.title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data.summary);
    } catch (e) {
      console.error(e);
      setSummary("Failed to load summary");
    }
    setLoading(false);
  };

  return (
    <div>
      {summary ? (
        <div
          className={`text-sm p-3 rounded-lg cursor-default ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {summary}
        </div>
      ) : (
        <button
          onClick={fetchSummary}
          disabled={loading}
          className={`px-3 py-1 rounded-lg flex items-center gap-2 transition-colors ${
            darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Summarizing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
              Summarize
            </>
          )}
        </button>
      )}
    </div>
  );
}
