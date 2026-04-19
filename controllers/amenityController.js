// controllers/amenity.controller.js
import Amenity from '../models/Amenity.js';
import { validateAmenity } from '../validations/amenity.validation.js';

export const createAmenity = async (req, res) => {
  const errors = validateAmenity(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const amenity = await Amenity.create(req.body);
  res.status(201).json(amenity);
};

export const getAmenities = async (req, res) => {
  const amenities = await Amenity.findAll();
  res.json(amenities);
};

export const updateAmenity = async (req, res) => {
  const amenity = await Amenity.findByPk(req.params.id);
  if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

  await amenity.update(req.body);
  res.json(amenity);
};

export const deleteAmenity = async (req, res) => {
  const amenity = await Amenity.findByPk(req.params.id);
  if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

  await amenity.destroy();
  res.json({ message: 'Amenity deleted successfully' });
};
