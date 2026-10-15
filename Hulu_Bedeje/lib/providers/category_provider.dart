import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'product_provider.dart';

// Provides the currently selected category string. Empty string '' means 'All Categories'.
final selectedCategoryProvider = StateProvider<String>((ref) => '');

// Extracts a unique list of categories directly from our fetched products!
final categoriesProvider = Provider<AsyncValue<List<String>>>((ref) {
  final productsAsync = ref.watch(productsProvider);
  
  return productsAsync.whenData((products) {
    // .map gets all categories, .toSet() removes duplicates, .toList() makes it a list again
    final categories = products.map((p) => p.category).toSet().toList();
    
    // Sort them alphabetically for a nicer UI
    categories.sort();
    
    return categories;
  });
});
