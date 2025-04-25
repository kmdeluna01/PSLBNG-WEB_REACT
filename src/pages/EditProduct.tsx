// Importing necessary React hooks and libraries
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // For routing
import axios from 'axios'; // For HTTP requests

// Importing custom UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast'; // Custom toast hook for notifications

// Base URL from environment variables or fallback
const baseURL = import.meta.env.VITE_API_URL || 'api';

const EditProduct = () => {
  // Getting product_id from URL parameters
  const { product_id } = useParams();
  const navigate = useNavigate(); // For navigation

  // State variables to hold product data
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // For loading state during upload

  // Fetch product details when component mounts or product_id changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await axios.get(`${baseURL}/product-details/${product_id}`);
        const product = res.data.data;

        if (product) {
          // Populate fields with existing product data
          setProductName(product.productName);
          setPrice(product.price.toString());
          setQuantity(product.quantity.toString());
          setDescription(product.description);
          setPhoto(product.image);
        } else {
          throw new Error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product details", error);
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        });
      }
    };

    fetchProductDetails();
  }, [product_id]);

  // Handle file input for changing the product photo
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  // Handle saving/edits to the product
  const handleEditProduct = async () => {
    setIsUploading(true); // Show loading state

    const formData = new FormData(); // Create form data for multipart/form upload
    formData.append('productName', productName);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('description', description);

    // Append photo only if it's a File (not a URL string)
    if (photo && photo instanceof File) {
      formData.append('photo', photo);
    }

    try {
      // Send PUT request to update the product
      await axios.put(`${baseURL}/merchant/${product_id}/edit-products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error("Error updating product", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }

    setIsUploading(false); // Reset loading state
  };

  // Handle deleting the product
  const handleDelete = async () => {
    try {
      await axios.delete(`${baseURL}/merchant/${product_id}/delete`);
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      navigate(-1); // Go back after deletion
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // UI rendering
  return (
    <div className="min-h-screen">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          {/* Back button */}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <CardTitle className="text-2xl text-vendor-800">Edit Product</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Photo upload section */}
            <Label htmlFor="photo">Change Photo</Label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full" />

            {/* Display photo preview */}
            {photo && (photo instanceof File ? (
              <img src={URL.createObjectURL(photo)} alt="Preview" className="w-40 h-40 object-cover rounded mx-auto" />
            ) : (
              <img src={photo} alt="Preview" className="w-40 h-40 object-cover rounded mx-auto" />
            ))}

            {/* Input fields for product info */}
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />

            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
            />

            <Label htmlFor="quantity">Available Stock</Label>
            <Input
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
            />

            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {/* Save and Delete buttons */}
            <div className="flex justify-between">
              <Button variant="custom" onClick={handleEditProduct} disabled={isUploading}>
                {isUploading ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  window.confirm("Are you sure you want to delete this product?") &&
                  handleDelete()
                }
              >
                Delete Product
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProduct;
