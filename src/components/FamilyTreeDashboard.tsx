import React, { useState, useEffect } from 'react'
import { useFamilyTreeStore } from '../stores/familyTreeStore'
import { useAuthStore } from '../stores/authStore'
import { Plus, TreePine, Users } from 'lucide-react'

const FamilyTreeDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { trees, loading, fetchTrees, createTree } = useFamilyTreeStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTreeName, setNewTreeName] = useState('')

  useEffect(() => {
    if (user) fetchTrees()
  }, [user, fetchTrees])

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTreeName.trim()) return
    await createTree({ name: newTreeName })
    setShowCreateModal(false)
    setNewTreeName('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Trees</h1>
            <p className="text-gray-600">Manage your genealogy research</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tree
          </button>
        </div>

        {trees.length === 0 ? (
          <div className="text-center py-12">
            <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No family trees yet</h3>
            <p className="text-gray-600 mb-4">Start building your family history</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Tree
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trees.map((tree) => (
              <div key={tree.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <TreePine className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold">{tree.name}</h3>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{tree.personCount} people</span>
                </div>
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Tree</button>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">Create Family Tree</h2>
              <form onSubmit={handleCreateTree}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tree Name *</label>
                  <input
                    type="text"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Family Tree"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FamilyTreeDashboard

