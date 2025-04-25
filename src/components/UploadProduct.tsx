// Import React and necessary hooks
import React, { useState, useEffect } from "react";

// Axios for making HTTP requests
import axios from "axios";

// React Router hook for navigation (not used in this component but included)
import { useNavigate } from "react-router-dom";

// Custom hook for showing toast notifications
import { useToast } from "@/hooks/use-toast";

// UI components for dialog/modal
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

// Use environment variable for API base URL, fallback to "api" if not set
const baseURL = import.meta.env.VITE_API_URL || "api";

// UploadProduct component receives `open`, `onClose`, and `onProductUploaded` as props
const UploadProduct = ({ open, onClose, onProductUploaded }) => {
  const navigate = useNavigate(); // Initialize navigation
  const { toast } = useToast();  // Initialize toast notifications

  // Form input states
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);         // Image file
  const [vendorId, setVendorId] = useState(null);   // Vendor ID from localStorage
  const [isUploading, setIsUploading] = useState(false); // Upload loading state

  // Get vendorId from localStorage when component mounts
  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    setVendorId(vendorId);
  }, []);

  // When a photo is selected, update the state
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  // Upload product to the backend server
  const handleUploadProduct = async () => {
    // Check if all fields are filled
    if (!productName || !price || !quantity || !description) {
      return toast({
        title: "Error",
        description: "Please fill all the fields",
        variant: "destructive",
      });
    }

    setIsUploading(true); // Start loading state

    // Create a FormData object to send as multipart/form-data
    const formData = new FormData();
    formData.append("vendorID", vendorId);
    formData.append("productName", productName);
    formData.append("price", price);
    formData.append("quantity", quantity);
    formData.append("description", description);

    // If a photo is selected, append it to the form data
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      // Send the product data to backend
      const response = await axios.post(`${baseURL}/upload-product`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { productId } = response.data;

      // If productId was not returned, show an error toast
      if (!productId) {
        setIsUploading(false);
        return toast({
          title: "Error",
          description: "Uploading Product Unsuccessful!",
          variant: "destructive",
        });
      }

      // Save the uploaded product to the merchant's profile
      await axios.put(`${baseURL}/merchant/${vendorId}/add-products`, { productId });

      // Call parent callback to refresh product list or update UI
      onProductUploaded();

      // Reset form
      setProductName("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setPhoto(null);
      onClose(); // Close the dialog

      // Show success toast
      toast({
        title: "Success",
        description: "Product Uploaded",
      });
    } catch (error) {
      console.error("Error uploading product", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Uploading Product Unsuccessful!",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false); // Stop loading state
    }
  };

  // Component UI
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sell Your Pasalubong</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          {/* Image upload input */}
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full" />

          {/* Show image preview if photo is selected */}
          {photo && (
            <img
              src={URL.createObjectURL(photo)}
              alt="Preview"
              className="w-40 h-40 object-cover rounded mx-auto"
            />
          )}

          {/* Product name input */}
          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />

          {/* Price input */}
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />

          {/* Quantity input */}
          <input
            type="number"
            placeholder="Available Stock"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />

          {/* Description input */}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          ></textarea>

          {/* Upload button */}
          <button
            onClick={handleUploadProduct}
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProduct;
