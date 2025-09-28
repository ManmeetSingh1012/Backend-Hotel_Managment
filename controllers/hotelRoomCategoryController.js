import { HotelRoomCategory, Hotel } from '../models/index.js';
import { Op } from 'sequelize';

// Create hotel room category
export const createHotelRoomCategory = async (req, res) => {
  try {
    const { categoryName, hotelId , roomCategoryPricing} = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    // Check if category name already exists for this hotel
    const existingCategory = await HotelRoomCategory.findOne({
      where: {
        categoryName: categoryName.trim(),
        hotelId: hotelId
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category already exists',
        message: 'A room category with this name already exists for this hotel'
      });
    }

    const category = await HotelRoomCategory.create({
      categoryName: categoryName.trim(),
      hotelId: hotelId,
      roomCategoryPricing: roomCategoryPricing
    });

    res.status(201).json({
      success: true,
      message: 'Hotel room category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating hotel room category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create hotel room category'
    });
  }
};

// Get all hotel room categories for a specific hotel
export const getHotelRoomCategories = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    const categories = await HotelRoomCategory.findAll({
      where: { hotelId },
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Hotel room categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching hotel room categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch hotel room categories'
    });
  }
};

// Get hotel room category by ID
export const getHotelRoomCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await HotelRoomCategory.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The specified hotel room category does not exist'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel room category retrieved successfully',
      data: category
    });
  } catch (error) {
    console.error('Error fetching hotel room category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch hotel room category'
    });
  }
};

// Update hotel room category
export const updateHotelRoomCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    const category = await HotelRoomCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The specified hotel room category does not exist'
      });
    }

    // Check if new category name already exists for this hotel
    if (categoryName && categoryName.trim() !== category.categoryName) {
      const existingCategory = await HotelRoomCategory.findOne({
        where: {
          categoryName: categoryName.trim(),
          hotelId: category.hotelId,
          id: { [Op.ne]: id }
        }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          error: 'Category already exists',
          message: 'A room category with this name already exists for this hotel'
        });
      }
    }

    await category.update({
      categoryName: categoryName ? categoryName.trim() : category.categoryName
    });

    res.status(200).json({
      success: true,
      message: 'Hotel room category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating hotel room category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update hotel room category'
    });
  }
};

// Delete hotel room category
export const deleteHotelRoomCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await HotelRoomCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The specified hotel room category does not exist'
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Hotel room category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hotel room category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete hotel room category'
    });
  }
};
