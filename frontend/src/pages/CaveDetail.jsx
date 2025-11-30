import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Import UI components
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CaveHeader from '../components/CaveHeader';
import LocationInfoCard from '../components/LocationInfoCard';
import MeasurementsCard from '../components/MeasurementsCard';
import QuickStatsCard from '../components/QuickStatsCard';
import PhotoGallery from '../components/PhotoGallery';
import PhotoModal from '../components/PhotoModal';
import MapActionsCard from '../components/MapActionsCard';
import DiscoveryInfoCard from '../components/DiscoveryInfoCard';
import ExplorationStatusCard from '../components/ExplorationStatusCard';

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
                const res = await fetch(`http://frontend.opencave.local/api/caves/${caveId}`);

                if (!res.ok) {
                    throw new Error("Failed to fetch cave");
                }

                const data = await res.json();
                setCave(data);

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

    if (loading) {
        return <LoadingSpinner message="Loading cave details..." />;
    }

    if (error) {
        return (
            <ErrorMessage
                error={error}
                onRetry={() => navigate('/caves')}
                retryText="Back to Cave Database"
            />
        );
    }

    const photos = cave.photos || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <CaveHeader
                cave={cave}
                onBack={() => navigate('/caves')}
            />

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 mt-12 relative z-20">
                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <LocationInfoCard cave={cave} />
                    <MeasurementsCard cave={cave} />
                    <QuickStatsCard cave={cave} photoCount={photos.length} />
                </div>

                {/* Photo Gallery */}
                <div className="mb-8">
                    <PhotoGallery
                        photos={photos}
                        onPhotoClick={openPhotoModal}
                    />
                </div>

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
                    <DiscoveryInfoCard cave={cave} />
                    <ExplorationStatusCard cave={cave} />
                </div>

                {/* Map Actions */}
                <MapActionsCard
                    cave={cave}
                    onViewOnCaveMap={() =>
                        navigate("/map", { state: { center: [cave.lng, cave.lat], zoom: 15 } })
                    }
                />
            </div>

            {/* Photo Modal */}
            <PhotoModal
                selectedPhoto={selectedPhoto}
                photos={photos}
                photoIndex={photoIndex}
                onClose={closePhotoModal}
                onNavigate={navigatePhoto}
            />
        </div>
    );
}