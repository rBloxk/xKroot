import Link from 'next/link'

const aiTools = [
  {
    name: 'Cursor AI',
    description: 'AI-powered code editor that accelerates development',
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    featured: true,
  },
  {
    name: 'GitHub Copilot',
    description: 'AI pair programmer for code suggestions',
    icon: '🤖',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'ChatGPT',
    description: 'AI assistant for problem-solving and ideation',
    icon: '💬',
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Claude AI',
    description: 'Advanced AI for complex reasoning and analysis',
    icon: '🧠',
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Midjourney',
    description: 'AI image generation for design assets',
    icon: '🎨',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Stable Diffusion',
    description: 'Open-source AI image generation',
    icon: '✨',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    name: 'Supabase AI',
    description: 'AI-powered database and backend services',
    icon: '🗄️',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    name: 'Vercel AI SDK',
    description: 'AI integration tools for Next.js',
    icon: '⚡',
    color: 'from-pink-500 to-rose-500',
  },
]

const developmentTools = [
  { name: 'Next.js', icon: '▲', description: 'React framework' },
  { name: 'TypeScript', icon: 'TS', description: 'Type-safe JavaScript' },
  { name: 'Tailwind CSS', icon: 'TW', description: 'Utility-first CSS' },
  { name: 'Supabase', icon: '⚡', description: 'Backend as a service' },
  { name: 'Vercel', icon: '▲', description: 'Deployment platform' },
  { name: 'Git', icon: '📦', description: 'Version control' },
]

export default function Team() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300/50 dark:border-white/20 bg-purple-100/80 dark:bg-purple-600/80 backdrop-blur-sm mb-8 animate-fade-in">
              <span className="text-sm font-semibold text-purple-800 dark:text-white">Meet the Team</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black dark:text-white leading-tight animate-fade-in delay-100">
              One Man Army
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Powered by AI, built with passion. One developer, unlimited possibilities.
            </p>
          </div>
        </div>
      </section>

      {/* One Man Army Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-6xl font-bold text-white shadow-2xl animate-pulse">
                    👨‍💻
                  </div>
                  <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl animate-bounce">
                    ⚡
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-gray">Solo Developer</h2>
                <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                  Building xkroot from the ground up, one line of code at a time. With the power of AI tools and modern development practices, what used to require a team of developers can now be accomplished by one passionate individual.
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                  This project demonstrates the incredible potential of AI-assisted development, where human creativity meets artificial intelligence to create something extraordinary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cursor AI Special Credit */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass-strong rounded-3xl p-8 md:p-12 animate-fade-in-up delay-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl">
                  🎯
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-gray">Special Thanks to Cursor AI</h2>
                  <p className="text-lg text-gray-dark dark:text-gray-dark">The coding companion that made this possible</p>
                </div>
              </div>
              <div className="space-y-4 text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                <p>
                  <strong className="text-black dark:text-gray">Cursor AI</strong> has been an indispensable tool in building xkroot. This AI-powered code editor has revolutionized the development workflow, providing intelligent code completion, context-aware suggestions, and seamless integration with the entire codebase.
                </p>
                <p>
                  From writing complex TypeScript components to debugging tricky issues, Cursor AI has been there every step of the way. It's not just a tool—it's a coding partner that understands context, suggests best practices, and helps turn ideas into reality faster than ever before.
                </p>
                <p>
                  This entire website, from the frontend components to the backend API routes, from database schemas to deployment configurations, has been built with the assistance of Cursor AI. It's a testament to how AI can amplify human capabilities and enable solo developers to build ambitious projects.
                </p>
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-dark/30">
                  <p className="text-xl font-semibold text-black dark:text-gray mb-2">
                    Thank you, Cursor AI, for making this possible! 🙏
                  </p>
                  <a
                    href="https://cursor.sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
                  >
                    Visit Cursor AI
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-gray">AI-Powered Development Stack</h2>
            <p className="text-lg text-gray-dark dark:text-gray-dark max-w-2xl mx-auto">
              The AI tools and assistants that power the development of xkroot
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiTools.map((tool, index) => (
              <div
                key={index}
                className={`glass rounded-2xl p-6 hover:glass-strong transition-all duration-300 hover:scale-105 animate-fade-in-up ${
                  tool.featured ? 'ring-2 ring-purple-500/50' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tool.featured && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      Featured
                    </span>
                  </div>
                )}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-3xl mb-4`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-black dark:text-gray">{tool.name}</h3>
                <p className="text-sm text-gray-dark dark:text-gray-dark leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Tools */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-black dark:text-gray">Development Tools & Technologies</h2>
            <p className="text-lg text-gray-dark dark:text-gray-dark mb-8 leading-relaxed">
              Built with modern, cutting-edge technologies that ensure scalability, performance, and maintainability.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {developmentTools.map((tool, index) => (
                <div
                  key={index}
                  className="glass-strong rounded-xl p-4 text-center hover:scale-105 transition-transform animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="text-3xl mb-2">{tool.icon}</div>
                  <div className="text-sm font-semibold text-black dark:text-gray">{tool.name}</div>
                  <div className="text-xs text-gray-dark dark:text-gray-dark mt-1">{tool.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black dark:text-gray">The Philosophy</h2>
            <div className="space-y-6 text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
              <p>
                In an era where AI is transforming every industry, software development is no exception. The "one man army" approach, powered by AI tools, represents a new paradigm in software development.
              </p>
              <p>
                By leveraging AI coding assistants like Cursor AI, a single developer can now accomplish what previously required entire teams. This isn't about replacing human creativity—it's about amplifying it. The developer provides vision, strategy, and creative direction, while AI handles the repetitive tasks, suggests optimizations, and helps navigate complex codebases.
              </p>
              <p>
                xkroot stands as a testament to this new era of development. Every feature, every component, every line of code has been crafted with the assistance of AI tools, proving that with the right tools and determination, one person can build something truly remarkable.
              </p>
              <div className="mt-8 p-6 rounded-xl glass-strong border-l-4 border-purple-500">
                <p className="text-xl font-semibold text-black dark:text-gray italic">
                  "The best way to predict the future is to build it. And with AI as your partner, the future is now."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Developer', value: '1', icon: '👨‍💻' },
              { label: 'AI Tools', value: '8+', icon: '🤖' },
              { label: 'Lines of Code', value: '10K+', icon: '💻' },
            ].map((stat, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-8 text-center hover:glass-strong transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{stat.icon}</div>
                <div className="text-4xl font-bold mb-2 text-black dark:text-gray">{stat.value}</div>
                <div className="text-lg text-gray-dark dark:text-gray-dark">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-gray">
              Interested in Building with AI?
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-dark mb-8 max-w-2xl mx-auto">
              Experience the power of AI-assisted development. Check out our projects, read our blog, or get in touch to learn more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/projects"
                className="glass px-8 py-4 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
              >
                View Projects
              </Link>
              <Link
                href="/blog"
                className="glass px-8 py-4 rounded-lg text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray font-semibold hover:scale-105 transition-transform"
              >
                Read Blog
              </Link>
              <Link
                href="/contact"
                className="glass px-8 py-4 rounded-lg text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray font-semibold hover:scale-105 transition-transform"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
