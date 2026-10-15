import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

// Provides our CartNotifier to the app
final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  static const String _cartKey = 'cart_items';
  
  // We start with an empty cart and immediately try to load saved items
  CartNotifier() : super([]) {
    _loadCart();
  }

  // Load cart from local storage
  Future<void> _loadCart() async {
    final prefs = await SharedPreferences.getInstance();
    final cartJsonStr = prefs.getString(_cartKey);
    
    if (cartJsonStr != null) {
      final List<dynamic> jsonList = json.decode(cartJsonStr);
      state = jsonList.map((json) => CartItem.fromJson(json)).toList();
    }
  }

  // Save cart to local storage whenever it changes
  Future<void> _saveCart() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = state.map((item) => item.toJson()).toList();
    await prefs.setString(_cartKey, json.encode(jsonList));
  }

  // Add a product to the cart (or increment quantity if already exists)
  void addToCart(Product product) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
    
    if (existingIndex >= 0) {
      // Product exists, increment quantity
      final existingItem = state[existingIndex];
      state = [
        ...state.sublist(0, existingIndex),
        existingItem.copyWith(quantity: existingItem.quantity + 1),
        ...state.sublist(existingIndex + 1),
      ];
    } else {
      // Product is new to cart
      state = [...state, CartItem(product: product)];
    }
    
    _saveCart();
  }

  // Change quantity (if 0 or less, remove it)
  void updateQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    state = state.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();
    
    _saveCart();
  }

  // Remove a product from the cart entirely
  void removeFromCart(int productId) {
    state = state.where((item) => item.product.id != productId).toList();
    _saveCart();
  }
}
  