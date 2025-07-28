import matplotlib.pyplot as plt

class Graphs:
    # Accepts a list of x points and y points to create a simple graph
    def __init__(self, xPoints: list, yPoints: list, title: str, xLabel: str, yLabel: str):
        self.x = xPoints
        self.y = yPoints
        self.title = title
        self.x_label = xLabel
        self.y_label = yLabel
    
    # Plots a bar graphy :)
    def plot_bar(self, filename: str = "bar.png"):
        plt.figure(figsize=(20, 10))
        plt.bar(self.x, self.y)
        plt.xlabel(self.x_label)
        plt.ylabel(self.y_label)
        plt.title(self.title)
        plt.xticks(rotation=60, ha='right')
        plt.tight_layout()
        plt.savefig(filename)
        plt.close()
    
    # Plots a line graphy :)
    def plot_line(self, filename: str = "line.png"):
        plt.figure(figsize=(20, 10))
        plt.plot(self.x, self.y, marker='o')
        plt.xlabel(self.x_label)
        plt.ylabel(self.y_label)
        plt.title(self.title)
        plt.xticks(rotation=60, ha='right')
        plt.tight_layout()
        plt.savefig(filename)
        plt.close()
    
    # Plots a pie graphy :)
    def plot_pie(self, filename="pie_chart.png"):
        plt.figure(figsize=(12, 12))
        #plt.pie(self.y, self.x, autopct='%1.1f%%', startangle=140)
        
        plt.pie(self.y, autopct='%1.1f%%', startangle=140)
        plt.legend(self.x, loc='center left', bbox_to_anchor=(1, 0.5))
        plt.title(self.title)
        plt.axis('equal')
        plt.tight_layout()
        plt.savefig(filename)
        plt.close()
