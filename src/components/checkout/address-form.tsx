"use client";

import React from "react";

// Exporte a interface ShippingAddress
export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressFormProps {
  shippingAddress: ShippingAddress;
  setShippingAddress: (address: ShippingAddress) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ shippingAddress, setShippingAddress }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value,
    });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        name="full_name"
        value={shippingAddress.full_name}
        onChange={handleChange}
        placeholder="Nome Completo"
        className="w-full p-2 border rounded"
      />
      <input
        type="email"
        name="email"
        value={shippingAddress.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full p-2 border rounded"
      />
      <input
        type="tel"
        name="phone"
        value={shippingAddress.phone}
        onChange={handleChange}
        placeholder="Telefone"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="address"
        value={shippingAddress.address}
        onChange={handleChange}
        placeholder="Endereço"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="city"
        value={shippingAddress.city}
        onChange={handleChange}
        placeholder="Cidade"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="state"
        value={shippingAddress.state}
        onChange={handleChange}
        placeholder="Estado"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="postal_code"
        value={shippingAddress.postal_code}
        onChange={handleChange}
        placeholder="CEP"
        className="w-full p-2 border rounded"
      />
    </div>
  );
};

export default AddressForm;