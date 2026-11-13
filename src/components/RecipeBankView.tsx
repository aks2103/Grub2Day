import React, { useState } from 'react';
import { Search, Plus, Flame, Clock, Baby, X } from 'lucide-react';
import { Recipe, DishCategory, MealSlot } from '../types';

interface RecipeBankViewProps {
  recipes: Recipe[];
  onAddCustomRecipe: (recipe: Recipe) => Promise<void>;
}

export const RecipeBankView: React.FC<RecipeBankViewProps> = ({
  recipes,
  onAddCustomRecipe,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Recipe Form State
  const [newName, setNewName] = useState('');
  const [newHindi, setNewHindi] = useState('');
  const [newSlot, setNewSlot] = useState<MealSlot>('dinner');
  const [newCategory, setNewCategory] = useState<DishCategory>('gravy_sabzi');
  const [newProtein, setNewProtein] = useState(15);
  const [newCalories, setNewCalories] = useState(250);
  const [newPrepTime, setNewPrepTime] = useState(25);
  const [newIngredients, setNewIngredients] = useState('');
  const [newKidTip, setNewKidTip] = useState('');
  const [newBooster, setNewBooster] = useState('');

  const categories = [
    { id: 'all', label: 'All Dishes' },
    { id: 'dal', label: 'Dals' },
    { id: 'legume', label: 'Rajma & Chhole' },
    { id: 'paneer', label: 'Paneer' },
    { id: 'dry_sabzi', label: 'Dry Sabzi' },
    { id: 'gravy_sabzi', label: 'Gravy Sabzi' },
    { id: 'desi_breakfast', label: 'Cheela / Paratha' },
    { id: 'egg_breakfast', label: 'Eggs' },
  ];

  const filtered = recipes.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.hindiName && r.hindiName.includes(search)) ||
      r.mainIngredients.some(i => i.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const recipe: Recipe = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      hindiName: newHindi.trim() || undefined,
      category: newCategory,
      suitableSlots: [newSlot],
      prepTimeMinutes: Number(newPrepTime) || 20,
      baseCalories: Number(newCalories) || 250,
      baseProteinGrams: Number(newProtein) || 15,
      mainIngredients: newIngredients.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      description: 'Custom family recipe added to your personal database.',
      kidFriendlyTip: newKidTip.trim() || 'Serve with mild spices or plain curd.',
      husbandProteinBooster: newBooster.trim() || '+ 2 boiled eggs or 100g paneer on side',
      addedProteinGrams: 12,
      isCustom: true,
    };

    await onAddCustomRecipe(recipe);
    setIsModalOpen(false);
    // Reset form
    setNewName('');
    setNewHindi('');
    setNewIngredients('');
    setNewKidTip('');
    setNewBooster('');
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-12">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
            <span>📖</span>
            <span>North Indian Recipe Bank ({recipes.length} Dishes)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Curated authentic home-style dishes tagged for protein & kid-friendliness
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dish name or ingredient (e.g. palak, rajma, eggs)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                categoryFilter === cat.id
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {recipe.name}
                  </h4>
                  {recipe.hindiName && (
                    <span className="text-[11px] font-semibold text-amber-700">
                      {recipe.hindiName}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold whitespace-nowrap">
                  {recipe.baseProteinGrams + recipe.addedProteinGrams}g Pro
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                {recipe.description}
              </p>

              {/* Kid friendly tip snippet */}
              <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100 text-[11px] text-amber-900 mb-2 flex items-start gap-1.5">
                <Baby className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{recipe.kidFriendlyTip}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {recipe.prepTimeMinutes} mins
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                {recipe.baseCalories} kcal
              </span>
              <span className="capitalize font-semibold text-slate-600">
                {recipe.suitableSlots.join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-5 overflow-hidden animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Add Custom Family Recipe</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mummy's Masala Dal"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hindi Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. दाल तड़का"
                  value={newHindi}
                  onChange={e => setNewHindi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Suitable Slot</label>
                  <select
                    value={newSlot}
                    onChange={e => setNewSlot(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="dinner">Dinner</option>
                    <option value="lunch">Lunch</option>
                    <option value="breakfast">Breakfast</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="gravy_sabzi">Gravy Sabzi</option>
                    <option value="dry_sabzi">Dry Sabzi</option>
                    <option value="dal">Dal</option>
                    <option value="legume">Legume (Rajma/Chhole)</option>
                    <option value="paneer">Paneer</option>
                    <option value="desi_breakfast">Desi Breakfast</option>
                    <option value="egg_breakfast">Egg Breakfast</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={newProtein}
                    onChange={e => setNewProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={e => setNewCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prep (mins)</label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={e => setNewPrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Ingredients (comma separated)</label>
                <input
                  type="text"
                  placeholder="paneer, tomato, onion, capsicum"
                  value={newIngredients}
                  onChange={e => setNewIngredients(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kid/Toddler Tip</label>
                <input
                  type="text"
                  placeholder="e.g. Separate mild portion before green chillies"
                  value={newKidTip}
                  onChange={e => setNewKidTip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Husband Protein Booster</label>
                <input
                  type="text"
                  placeholder="e.g. + 2 boiled eggs on the side (+12g)"
                  value={newBooster}
                  onChange={e => setNewBooster(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
              >
                Save to Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
