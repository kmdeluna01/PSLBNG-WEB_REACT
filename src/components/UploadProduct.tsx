import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

const baseURL = import.meta.env.VITE_API_URL || "api";

const UploadProduct = ({ open, onClose, onProductUploaded  }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [vendorId, setVendorId] = useState(null);

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    setVendorId(vendorId);
  }, []);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleUploadProduct = async () => {
    if (!productName || !price || !quantity || !description) {
      return toast({
        title: "Error",
        description: "Please fill all the fields",
        variant: "destructive",
      });
    }

    const formData = new FormData();
    formData.append("vendorID", vendorId);
    formData.append("productName", productName);
    formData.append("price", price);
    formData.append("quantity", quantity);
    formData.append("description", description);

    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const response = await axios.post(`${baseURL}/upload-product`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { productId } = response.data;

      if (!productId) {
        return toast({
          title: "Error",
          description: "Uploading Product Unsuccessful!",
          variant: "destructive",
        });
      }

      await axios.put(`${baseURL}/merchant/${vendorId}/add-products`, { productId });

      onProductUploaded();

      setProductName("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setPhoto(null);
      onClose();

      toast({
        title: "Success",
        description: "Product Uploaded",
      });
    } catch (error) {
      console.error("Error uploading product", error);
      toast({
        title: "Error",
        description: "Uploading Product Unsuccessful!",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sell Your Pasalubong</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full" />
          {photo && <img src={URL.createObjectURL(photo)} alt="Preview" className="w-40 h-40 object-cover rounded mx-auto" />}

          <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
          <input type="number" placeholder="Available Stock" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-md"></textarea>

          <button onClick={handleUploadProduct} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Upload</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProduct;
