import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const baseURL = import.meta.env.VITE_API_URL || 'api';

const EditProduct = () => {
  const { product_id } = useParams();
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await axios.get(`${baseURL}/product-details/${product_id}`);
        const product = res.data.data;

        if (product) {
          setProductName(product.productName);
          setPrice(product.price.toString());
          setQuantity(product.quantity.toString());
          setDescription(product.description);
          if (product.image) {
            setPhoto({ uri: `${baseURL}/${product.image.replace(/\\/g, '/')}` });
          }
        } else {
          throw new Error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product details", error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        });
      }
    };

    fetchProductDetails();
  }, [product_id]);

  const choosePhotoFromLibrary = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleEditProduct = async () => {
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('description', description);

    if (photo && photo instanceof File) {
      formData.append('photo', photo);
    }

    try {
      await axios.put(`${baseURL}/merchant/${product_id}/edit-products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });
      navigate(-1);
    } catch (error) {
      console.error("Error updating product", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${baseURL}/merchant/${product_id}/delete`);
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      navigate(-1);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <CardTitle className="text-2xl text-vendor-800">Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="photo">Change Photo</Label>
            <Input id="photo" type="file" onChange={choosePhotoFromLibrary} />
            {photo && (
              <img
                src={photo instanceof File ? URL.createObjectURL(photo) : photo.uri}
                alt={photo.uri}
                className="w-auto h-48 mx-auto block object-cover rounded-lg mt-4"
              />
            )}
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
            <div className="flex justify-between">
              <Button variant="custom" onClick={handleEditProduct}>
                Update
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