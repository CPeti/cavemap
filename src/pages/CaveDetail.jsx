import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  ArrowLeftIcon,
  MapPinIcon,
  ArrowDownIcon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Material Design Photo Thumbnail Component
const PhotoThumbnail = ({ photo, index, onClick }) => {
  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-200 aspect-square shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <img
        src={photo.url}
        alt={photo.caption || photo.filename || `Cave photo ${index + 1}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onLoad={() => console.log(`Image ${index} loaded successfully`)}
        onError={(e) => {
          console.error(`Image ${index} failed to load:`, photo.url);
          e.target.style.backgroundColor = '#ef4444';
          e.target.style.border = '2px solid #ef4444';
        }}
      />
    </div>
  );
};

export default function CaveDetail() {
  const { caveId } = useParams();
  const navigate = useNavigate();
  const [cave, setCave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const openPhotoModal = (photo, index) => {
    setSelectedPhoto(photo);
    setPhotoIndex(index);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setPhotoIndex(0);
  };

  const navigatePhoto = (direction) => {
    const photos = cave.photos || [];
    if (direction === 'next' && photoIndex < photos.length - 1) {
      const newIndex = photoIndex + 1;
      setPhotoIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    } else if (direction === 'prev' && photoIndex > 0) {
      const newIndex = photoIndex - 1;
      setPhotoIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closePhotoModal();
    } else if (e.key === 'ArrowRight') {
      navigatePhoto('next');
    } else if (e.key === 'ArrowLeft') {
      navigatePhoto('prev');
    }
  };

  useEffect(() => {
    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto, photoIndex, cave]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium">Loading cave details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/caves')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Cave Database
          </button>
        </div>
      </div>
    );
  }

  const photos = cave.photos || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with FAB-style back button */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-16">
            <button
              onClick={() => navigate('/caves')}
              className="mb-8 inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm text-black px-4 py-2 rounded-full font-medium hover:bg-opacity-30 transition-all duration-200 shadow-lg"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Database
            </button>
            
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {cave.name || "Unknown Cave"}
              </h1>
              {cave.code && (
                <div className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-lg font-medium text-black">Code: {cave.code}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <MapPinIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Location</h2>
            </div>
            
            <div className="space-y-4">
              {cave.zone && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Zone</span>
                  <span className="text-gray-900 font-semibold">{cave.zone}</span>
                </div>
              )}
              {cave.lat && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600 font-medium">GPS North</span>
                  <span className="text-gray-900 font-mono text-sm">{cave.lat.toFixed(6)}</span>
                </div>
              )}
              {cave.lng && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600 font-medium">GPS East</span>
                  <span className="text-gray-900 font-mono text-sm">{cave.lng.toFixed(6)}</span>
                </div>
              )}
              {cave.altitude ? (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600 font-medium">Altitude ASL</span>
                  <span className="text-gray-900 font-semibold">{cave.altitude} m</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Measurements Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <ArrowDownIcon className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Measurements</h2>
            </div>
            
            <div className="space-y-4">
              {(cave.depth != null) && (
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{cave.depth}</div>
                  <div className="text-gray-600 font-medium">meters deep</div>
                </div>
              )}
              {(cave.length != null) && (
                <div className="text-center py-4 border-t border-gray-100">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{cave.length}</div>
                  <div className="text-gray-600 font-medium">meters total length</div>
                </div>
              )}
              {!cave.depth && !cave.length && (
                <div className="text-center py-8 text-gray-500">
                  No measurement data available
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <PhotoIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Quick Stats</h2>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-gray-900 mb-1">{photos.length}</div>
                <div className="text-gray-600 font-medium">Photos</div>
              </div>
              {cave.discoveryDate && (
                <div className="text-center py-2 border-t border-gray-100">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{cave.discoveryDate}</div>
                  <div className="text-gray-600 font-medium">Discovered</div>
                </div>
              )}
              {cave.explorationStatus && (
                <div className="text-center py-2 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-900 mb-1">{cave.explorationStatus}</div>
                  <div className="text-gray-600 font-medium">Mapping Status</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photos Section */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <PhotoIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Photo Gallery
                <span className="text-lg font-normal text-gray-500 ml-2">({photos.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <PhotoThumbnail
                  key={index}
                  photo={photo}
                  index={index}
                  onClick={() => openPhotoModal(photo, index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        {cave.description && (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {cave.description}
              </p>
            </div>
          </div>
        )}

        {/* Additional Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Discovery Information */}
          {(cave.discoveryDate || cave.discoveredBy) && (
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Discovery Information</h2>
              <div className="space-y-4">
                {cave.discoveryDate && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Discovery Date</span>
                    <span className="text-gray-900 font-semibold">{cave.discoveryDate}</span>
                  </div>
                )}
                {cave.discoveredBy && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Contact for Info</span>
                    <span className="text-gray-900 font-semibold">{cave.discoveredBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exploration Status */}
          {(cave.explorationStatus || cave.lastSurveyed) && (
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Exploration Status</h2>
              <div className="space-y-4">
                {cave.explorationStatus && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Mapping Status</span>
                    <span className="text-gray-900 font-semibold">{cave.explorationStatus}</span>
                  </div>
                )}
                {cave.lastSurveyed && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Last Surveyed</span>
                    <span className="text-gray-900 font-semibold">{cave.lastSurveyed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Actions */}
        {cave.lat && cave.lng && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">View Location</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`https://maps.google.com/?q=${cave.lat},${cave.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <MapPinIcon className="w-5 h-5 mr-3" />
                Open in Google Maps
              </a>

              <button
                onClick={() =>
                  navigate("/map", { state: { center: [cave.lng, cave.lat], zoom: 15 } })
                }
                className="flex-1 inline-flex items-center justify-center px-6 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <MapPinIcon className="w-5 h-5 mr-3" />
                View on Cave Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-6 right-6 z-10 p-3 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 shadow-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto('prev');
                  }}
                  disabled={photoIndex === 0}
                  className="absolute left-6 z-10 p-4 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto('next');
                  }}
                  disabled={photoIndex === photos.length - 1}
                  className="absolute right-6 z-10 p-4 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || selectedPhoto.filename || 'Cave photo'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />

              {/* Photo Info */}
              {(selectedPhoto.caption || selectedPhoto.photographer) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-sm text-white p-6 rounded-b-lg">
                  {selectedPhoto.caption && (
                    <h3 className="font-semibold text-xl mb-2">{selectedPhoto.caption}</h3>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <div>
                      {selectedPhoto.photographer && (
                        <span className="font-medium">Photo by {selectedPhoto.photographer}</span>
                      )}
                    </div>
                    <div>
                      {photos.length > 1 && (
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-medium">
                          {photoIndex + 1} of {photos.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}