from app import create_app
from config import get_config

# Load configuration
config_class = get_config()
app = create_app(config_class)

if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════╗")
    print("║     HireFlowAI — Backend-2 (AI Service) Started! 🤖  ║")
    print("╚══════════════════════════════════════════════════════╝")
    print(f"\n📡  Server    : http://localhost:{config_class.PORT}")
    print(f"📋  API Base  : http://localhost:{config_class.PORT}/api/v1")
    print(f"❤️   Health   : http://localhost:{config_class.PORT}/health")
    print(f"🌍  Env       : {config_class.FLASK_ENV}\n")

    app.run(
        host="0.0.0.0",
        port=config_class.PORT,
        debug=config_class.DEBUG,
    )
