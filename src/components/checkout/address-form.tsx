"use client";

import { motion } from "framer-motion";
import { ShippingAddress } from "@/types/admin";

interface AddressFormProps {
  address: ShippingAddress;
  onAddressChange: (address: ShippingAddress) => void;
  onSave: () => void;
}

export default function AddressForm({ address, onAddressChange, onSave }: AddressFormProps) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            required
            value={address.full_name}
            onChange={(e) => onAddressChange({ ...address, full_name: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={address.email}
            onChange={(e) => onAddressChange({ ...address, email: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          required
          value={address.phone}
          onChange={(e) => onAddressChange({ ...address, phone: e.target.value })}
          className="w-full p-2 rounded-lg border bg-background"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          required
          value={address.address}
          onChange={(e) => onAddressChange({ ...address, address: e.target.value })}
          className="w-full p-2 rounded-lg border bg-background"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            required
            value={address.city}
            onChange={(e) => onAddressChange({ ...address, city: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input
            type="text"
            required
            value={address.state}
            onChange={(e) => onAddressChange({ ...address, state: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Postal Code</label>
        <input
          type="text"
          required
          value={address.postal_code}
          onChange={(e) => onAddressChange({ ...address, postal_code: e.target.value })}
          className="w-full p-2 rounded-lg border bg-background"
        />
      </div>
      <motion.button
        type="button"
        onClick={onSave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
      >
        Save Address
      </motion.button>
    </form>
  );
}
