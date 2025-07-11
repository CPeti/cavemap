import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeftIcon, MapPinIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function CaveDetail() {
  const { caveId } = useParams();
  const navigate = useNavigate();
  const [cave, setCave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCave() {
      try {
        const docRef = doc(db, "caves", caveId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCave({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Cave not found");
        }
      } catch (err) {
        console.error("Error fetching cave:", err);
        setError("Failed to load cave data");
      } finally {
        setLoading(false);
      }
    }

    fetchCave();
  }, [caveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading cave details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/caves')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Cave Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/caves')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Database
        </button>

        {/* Cave Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700">
            <h1 className="text-3xl font-bold text-white">
              {cave.name || "Unknown Cave"}
            </h1>
            {cave.code && (
              <p className="text-blue-100 mt-2 text-lg">Code: {cave.code}</p>
            )}
          </div>

          {/* Cave Information Grid */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Location
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {cave.zone && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Zone:</span>
                      <span className="text-gray-900">{cave.zone}</span>
                    </div>
                  )}
                  {cave.lat && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">GPS North:</span>
                      <span className="text-gray-900">{cave.lat.toFixed(6)}</span>
                    </div>
                  )}
                  {cave.lng && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">GPS East:</span>
                      <span className="text-gray-900">{cave.lng.toFixed(6)}</span>
                    </div>
                  )}
                  {(cave.asl || cave.altitude) && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">ASL:</span>
                      <span className="text-gray-900">{cave.asl || cave.altitude} m</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Characteristics */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ArrowDownIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Measurements
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {(cave.depth) && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Vertical Depth:</span>
                      <span className="text-gray-900 flex items-center">{cave.depth} m</span>
                    </div>
                  )}
                  {cave.length && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Total Length:</span>
                      <span className="text-gray-900">{cave.length} m</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <hr className="my-6 border-gray-400" />

            {/* Description Section */}
            {cave.description && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {cave.description}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discovery Information */}
              {(cave.discoveryDate || cave.discoveredBy) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Discovery</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {cave.discoveryDate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="text-gray-900">{cave.discoveryDate}</span>
                      </div>
                    )}
                    {cave.discoveredBy && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Discovered by:</span>
                        <span className="text-gray-900">{cave.discoveredBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Exploration Status */}
              {(cave.explorationStatus || cave.lastSurveyed) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Exploration</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {cave.explorationStatus && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="text-gray-900">{cave.explorationStatus}</span>
                      </div>
                    )}
                    {cave.lastSurveyed && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Last Surveyed:</span>
                        <span className="text-gray-900">{cave.lastSurveyed}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {cave.lat && cave.lng && (
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                {/* Google Maps */}
                <a
                  href={`https://maps.google.com/?q=${cave.lat},${cave.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  View on Google Maps
                </a>

                {/* Internal MapView */}
                <button
                  onClick={() =>
                    navigate("/map", { state: { lat: cave.lat, lng: cave.lng, zoom: 15} })
                  }
                  className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  View on Cave Map
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}