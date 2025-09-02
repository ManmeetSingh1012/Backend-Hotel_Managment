import Menu from '../models/Menu.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';

// Create a new menu
export const createMenu = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, halfPlatePrice, fullPlatePrice, description } = req.body;
    const createdBy = req.user.id; // Get from authenticated user

    // // Check if menu with same name already exists for this user
    // const existingMenu = await Menu.findOne({ 
    //   where: { 
    //     name: name.trim(),
    //     createdBy: createdBy
    //   },
    //   transaction
    // });
    
    // if (existingMenu) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Menu with this name already exists'
    //   });
    // }

    const menu = await Menu.create({
      name: name.trim(),
      halfPlatePrice: halfPlatePrice || null,
      fullPlatePrice,
      description: description ? description.trim() : null,
      createdBy
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: menu
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu',
      error: error.message
    });
  }
};

// Get all menus
export const getMenus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;

    const menus = await Menu.findAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']],
      transaction
    });

    await transaction.commit();

    // Always return success, even if no data (empty array)
    res.status(200).json({
      success: true,
      message: 'Menus retrieved successfully',
      data: menus,
     
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error fetching menus:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menus',
      error: error.message
    });
  }
};

// Get a specific menu by ID
export const getMenuById = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const menu = await Menu.findOne({
      where: { 
        id: id,
        createdBy: userId
      },
      transaction
    });
    
    await transaction.commit();
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu retrieved successfully',
      data: menu
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu',
      error: error.message
    });
  }
};

// Update a menu
export const updateMenu = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { name, halfPlatePrice, fullPlatePrice, description } = req.body;
    const userId = req.user.id;

    const menu = await Menu.findOne({
      where: { 
        id: id,
        createdBy: userId
      },
      transaction
    });
    
    if (!menu) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // // Check if name is being changed and if it conflicts with existing menu for this user
    // if (name && name.trim() !== menu.name) {
    //   const existingMenu = await Menu.findOne({ 
    //     where: { 
    //       name: name.trim(),
    //       createdBy: userId,
    //       id: { [Menu.sequelize.Sequelize.Op.ne]: id }
    //     },
    //     transaction
    //   });
      
    //   if (existingMenu) {
    //     await transaction.rollback();
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Menu with this name already exists'
    //     });
    //   }
    // }

    // Update menu
    await menu.update({
      name: name ? name.trim() : menu.name,
      halfPlatePrice: halfPlatePrice !== undefined ? halfPlatePrice : menu.halfPlatePrice,
      fullPlatePrice: fullPlatePrice || menu.fullPlatePrice,
      description: description !== undefined ? (description ? description.trim() : null) : menu.description
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: menu
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu',
      error: error.message
    });
  }
};

// Delete a menu
export const deleteMenu = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const menu = await Menu.findOne({
      where: { 
        id: id,
        createdBy: userId
      },
      transaction
    });
    
    if (!menu) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    await menu.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu',
      error: error.message
    });
  }
};

// Search menus by name
export const searchMenu = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    // // If no search query provided, return all menus
    // if (!search || search.trim() === '') {
    //   const menus = await Menu.findAll({
    //     where: { createdBy: userId },
    //     attributes: ['id', 'name', 'halfPlatePrice', 'fullPlatePrice'],
    //     order: [['name', 'ASC']]
    //   });

    //   return res.status(200).json({
    //     success: true,
    //     message: 'All menus retrieved successfully',
    //     data: menus
    //   });
    // }

    // Search for menus with name containing the search term (case-insensitive)
    const menus = await Menu.findAll({
      where: {
        createdBy: userId,
        name: {
          [Op.iLike]: `%${search.trim()}%` // Case-insensitive partial match
        }
      },
      attributes: ['id', 'name', 'halfPlatePrice', 'fullPlatePrice'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Found ${menus.length} menu(s) matching "${search}"`,
      data: menus
    });

  } catch (error) {
    console.error('Error searching menus:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching menus',
      error: error.message
    });
  }
};
