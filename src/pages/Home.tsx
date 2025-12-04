import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Users, Search, Dna, Shield, ArrowRight, Star, Heart, BookOpen } from 'lucide-react';

export function Home() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: Users,
      title: 'Build Family Trees',
      description: 'Create and explore your family history with our intuitive tree builder.',
    },
    {
      icon: Search,
      title: 'Research Records',
      description: 'Access billions of historical records to discover your ancestors.',
    },
    {
      icon: Dna,
      title: 'DNA Integration',
      description: 'Upload DNA data to find genetic matches and ethnicity estimates.',
    },
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Your data is secure with enterprise-grade encryption and GDPR compliance.',
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Genealogy Enthusiast",
      content: "This platform helped me discover my great-grandmother's immigration records. The AI suggestions were incredibly accurate!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Family Historian",
      content: "The DNA matching feature connected me with 3rd cousins I never knew existed. Amazing technology!",
      rating: 5,
    },
    {
      name: "Emma Rodriguez",
      role: "Professional Researcher",
      content: "The collaborative features make it easy to work with family members on our shared tree. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Your{' '}
              <span className="text-blue-600">Family History</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Build your family tree, connect with relatives, and uncover the stories of your ancestors with our powerful genealogy platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Your Tree Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/trees"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Your Trees
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Trace Your Roots
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to build, research, and share your family history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Families
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about their genealogy journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Heart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of families who have already discovered their roots. Start building your family tree today.
          </p>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/trees"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Continue Your Research
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Genealogy Platform</span>
              </div>
              <p className="text-gray-400">
                Discovering family histories and connecting generations.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/trees" className="hover:text-white">Family Trees</Link></li>
                <li><Link to="/research" className="hover:text-white">Research Tools</Link></li>
                <li><Link to="/dna" className="hover:text-white">DNA Analysis</Link></li>
                <li><Link to="/collaboration" className="hover:text-white">Collaboration</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Newsletter</a></li>
                <li><a href="#" className="hover:text-white">Social Media</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Genealogy Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}