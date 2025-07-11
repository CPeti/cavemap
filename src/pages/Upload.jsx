import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

export default function Upload() {
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    description: "",
    depth: "",
    length: "",
    altitude: "",
    map: [],
    gallery: [],
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((f) => ({ ...f, [name]: files }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  }

  async function uploadImages(folderName, fileList) {
    const urls = [];
    for (let file of fileList) {
      const fileRef = ref(storage, `caves/${folderName}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }
    return urls;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { name, latitude, longitude, zone, code, description, depth, length, altitude, map, gallery } = formData;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!name.trim() || !description.trim() || isNaN(lat) || isNaN(lng)) {
      alert("Please fill in all required fields with valid data.");
      return;
    }

    setLoading(true);

    try {
      const mapUrls = map.length ? await uploadImages("maps", map) : [];
      const galleryUrls = gallery.length ? await uploadImages("gallery", gallery) : [];

      await addDoc(collection(db, "caves"), {
        name: name.trim(),
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        zone: zone.trim() || "Unknown",
        code: code.trim() || "",
        description: description.trim(),
        depth: depth ? parseFloat(depth) : null,
        length: length ? parseFloat(length) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        maps: mapUrls,
        gallery: galleryUrls,
        createdAt: serverTimestamp(),
      });

      alert("Cave uploaded successfully!");
      setFormData({
        name: "",
        latitude: "",
        longitude: "",
        zone: "",
        code: "",
        description: "",
        depth: "",
        length: "",
        altitude: "",
        map: [],
        gallery: [],
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-4"
    >
      <h2 className="text-xl font-semibold">Upload New Cave</h2>

      <input
        name="name"
        placeholder="Cave Name"
        type="text"
        required
        value={formData.name}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          name="zone"
          placeholder="Zone"
          type="text"
          value={formData.zone}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          name="code"
          placeholder="Code"
          type="text"
          value={formData.code}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          name="latitude"
          placeholder="Latitude"
          type="number"
          step="any"
          required
          value={formData.latitude}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          name="longitude"
          placeholder="Longitude"
          type="number"
          step="any"
          required
          value={formData.longitude}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        rows={3}
        required
        value={formData.description}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
      />

      <div className="grid grid-cols-3 gap-4">
        <input
          name="depth"
          placeholder="Depth"
          type="number"
          value={formData.depth}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          name="length"
          placeholder="Length"
          type="number"
          value={formData.length}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          name="altitude"
          placeholder="Altitude"
          type="number"
          value={formData.altitude}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Map Images</label>
        <input
          name="map"
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Gallery Images</label>
        <input
          name="gallery"
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <button
        type="submit"
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Submit"}
      </button>
    </form>
  );
}
