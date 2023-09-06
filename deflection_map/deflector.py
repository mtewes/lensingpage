import numpy as np
import numpy.fft as fftengine
import astropy.io.fits as pyfits
import matplotlib.pyplot as plt
import matplotlib.cbook as cbook
from scipy.ndimage import gaussian_filter
from PIL import Image

class deflector(object):
    """
    initialize the deflector using a surface density (convergence) map
    the boolean variable pad indicates whether zero-padding is used
    or not
    """
    def __init__(self,filekappa,pad=False):
        #kappa,header=pyfits.getdata(filekappa,header=True)
        #kappa=pyfits.getdata(filekappa)
        kappa=np.loadtxt(filekappa)
        self.kappa=kappa
        self.nx=kappa.shape[0]
        self.ny=kappa.shape[1]
        self.pad=pad
        if (pad):
            self.kpad()
        self.kx,self.ky=self.kernel()
    
    """
    implement the kernel function K
    """
    def kernel(self):
        x=np.linspace(-7,7,self.kappa.shape[0])
        y=np.linspace(-7,7,self.kappa.shape[1])
        kx,ky=np.meshgrid(x,y)
        norm=(kx**2+ky**2+1e-12)
        kx=kx/norm
        ky=ky/norm
        return(kx,ky)
    
    """
    compute the deflection angle maps by convolving
    the surface density with the kernel function
    Note that the returned values will be in pixel units
    """
    def angles(self):
        # FFT of the surface density and of the two components of the kernel
        kappa_ft = fftengine.fftn(self.kappa,axes=(0,1)) #originally rfftn used but this cropped the last axis in the output
        kernelx_ft = fftengine.fftn(self.kx,axes=(0,1), s=self.kappa.shape)
        kernely_ft = fftengine.fftn(self.ky,axes=(0,1), s=self.kappa.shape)
        # perform the convolution in Fourier space and transform the result
        # back in real space. Note that a shift needs to be applied using fftshift
        alphax = 1.0/np.pi*fftengine.fftshift(fftengine.ifftn(kappa_ft*kernelx_ft))
        alphay = 1.0/np.pi*fftengine.fftshift(fftengine.ifftn(kappa_ft*kernely_ft))
        alphax = np.real(alphax)
        alphay = np.real(alphay)
        return(alphax,alphay)
    
    """
    returns the surface-density (convergence) of the deflector
    """
    def kmap(self):
        return(self.kappa)
    
    """
    performs zero-padding
    """
    def kpad(self):
        # add zeros around the original array
        def padwithzeros(vector, pad_width, iaxis, kwargs):
            vector[:pad_width[0]] = 0
            vector[-pad_width[1]:] = 0
            return vector
        # use the pad method from numpy.lib to add zeros (padwithzeros)
        # in a frame with thickness self.kappa.shape[0]
        self.kappa=np.lib.pad(self.kappa, self.kappa.shape[0], padwithzeros)

    """
    crop the maps to remove zero-padded areas and get back to the
    original region.
    """
    def mapCrop(self,mappa):
        xmin=np.int(0.5*(self.kappa.shape[0]-self.nx))
        ymin=np.int(0.5*(self.kappa.shape[1]-self.ny))
        xmax=xmin+self.nx
        ymax=ymin+self.ny
        mappa=mappa[xmin:xmax,ymin:ymax]
        return(mappa)

class txt_from_img(object):
    def __init__(self, filekappa):
        with cbook.get_sample_data(filekappa) as image_file:
            kappa = plt.imread(image_file)
        self.kappa = kappa
    
    def create_txt(self, px, py, N, fileoutput):
        #crop kappa map to square with side length N
        kappa_crop = self.kappa[px:px+N, py:py+N,:]
        #collect all galaxies / all mass in the blue bins
        for i in range(kappa_crop[:,0,0].size):
            for j in range(kappa_crop[0,:,0].size):
                #put everything in blue bins, red dwarf galaxies are weighted with 1/10
                kappa_crop[i,j,2] += kappa_crop[i,j,1] + kappa_crop[i,j,0]/10
                kappa_crop[i,j,0] = 0
                kappa_crop[i,j,1] = 0
                kappa_crop[i,j,3] = 255
        #smooth the mass distribution with gaussian filter function
        kappa = gaussian_filter(kappa_crop[:,:,2], 20, mode='wrap')
        np.savetxt(fileoutput, kappa)

class defl_img(object):
    def __init__(self, angx, angy):
        self.angx = angx
        self.angy = angy
    
    def create_defl_img(self, fileoutputx, fileoutputy):
        N = self.angx[:,0].size
        img_arr_x = np.zeros((N, N, 3))
        img_arr_y = np.zeros((N, N, 3))
        #filter positive and negative angles
        alphax_pos = np.abs(self.angx)*(self.angx > 0)
        alphax_neg = np.abs(self.angx)*(self.angx < 0)
        alphay_pos = np.abs(self.angy)*(self.angy > 0)
        alphay_neg = np.abs(self.angy)*(self.angy < 0)
        #put positive angles in red bins, negative angles in blue bins
        img_arr_x[:,:,0] = alphax_pos
        img_arr_x[:,:,2] = alphax_neg
        img_arr_y[:,:,0] = alphay_pos
        img_arr_y[:,:,2] = alphay_neg
        #find max deflection angle
        alphax_max = max(alphax_pos.max(), alphax_neg.max())
        alphay_max = max(alphay_pos.max(), alphay_neg.max())
        #and normalize angles to 255
        img_arr_x *= 255/alphax_max
        img_arr_y *= 255/alphay_max
        #create image from normalized arrays
        imgx = Image.fromarray(img_arr_x.astype('uint8'), 'RGB')
        imgy = Image.fromarray(img_arr_y.astype('uint8'), 'RGB')
        imgx.save(fileoutputx)
        imgy.save(fileoutputy)
