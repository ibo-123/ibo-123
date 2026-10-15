import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import 'product_provider.dart';

// Provides the current search query string. It defaults to an empty string.
final searchQueryProvider = StateProvider<String>((ref) => '');

// This provider watches both the raw products from the API and the search query.
// It returns a filtered list of products if a search is active.
final filteredProductsProvider = Provider<AsyncValue<List<Product>>>((ref) {
  final productsAsync = ref.watch(productsProvider);
  final searchQuery = ref.watch(searchQueryProvider).toLowerCase();

  // whenData allows us to manipulate the data ONLY when the AsyncValue is in the 'data' state.
  return productsAsync.whenData((products) {
    if (searchQuery.isEmpty) {
      return products; // Return all if no search query
    }
    
    // Filter by checking if the product title contains the search query
    return products.where((product) {
      return product.title.toLowerCase().contains(searchQuery);
    }).toList();
  });
});
